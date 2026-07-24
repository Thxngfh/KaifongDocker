"""
train_cluster_model.py
========================
Complaint Spatial Clustering Model — headless/production version.
Converted from complaint_clustering_model_v4.ipynb for scheduled batch runs.

Runs K-means clustering on district-level complaint profiles, validates with
DBSCAN, auto-generates cluster labels/insights, and writes results to:
  - cluster_model_runs
  - cluster_groups
  - cluster_district_map

Promotion logic (unchanged from notebook):
  - No active run yet          -> promote this run immediately (avoid empty dashboard)
  - This run's silhouette > active run's silhouette -> promote (replace old)
  - Otherwise                  -> insert as history only (is_active = FALSE)
"""

import os
import sys
from datetime import datetime

import numpy as np
import pandas as pd
from sqlalchemy import create_engine
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans, DBSCAN
from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA
from sklearn.neighbors import NearestNeighbors
import psycopg2
import psycopg2.extras


# ============================================================
# Config — env-driven so the same image works across environments
# ============================================================
DATABASE_URL = "postgresql://kaifong:kaifong1234@localhost:5433/kaifongdb" # e.g. postgresql://kaifong:kaifong1234@db:5432/kaifongdb

MAX_K = int(os.environ.get("CLUSTER_MAX_K", 6))
PCA_COMPONENTS = int(os.environ.get("CLUSTER_PCA_COMPONENTS", 2))
MIN_CITYWIDE_SHARE = 0.03
MIN_COMPLAINTS_PER_DISTRICT = 5

WEIGHT_RISK = 3.0
WEIGHT_VOLUME = 1.5
WEIGHT_MIX = 1.0

CLUSTER_COLORS = ['#E53935', '#FB8C00', '#43A047', '#1E88E5',
                   '#8E24AA', '#00ACC1', '#F4511E', '#6D4C41']


def log(msg):
    print(f"[{datetime.now().isoformat(timespec='seconds')}] {msg}", flush=True)
  
def clean_raw_data(df):
    df = df.drop_duplicates(subset=['complaint_id'])
    text_cols = ['district', 'category_name', 'subcategory_name', 'detail']
    for col in text_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()
            df[col] = df[col].str.replace(r'\s+', ' ', regex=True)
    return df

def load_data(engine):
    tables = ['complaints', 'categories', 'subcategories', 'priority_levels', 'workflow_logs']
    dfs = {}
    for t in tables:
        dfs[t] = pd.read_sql(f'SELECT * FROM public.{t}', engine)
        log(f'{t:20s}: {len(dfs[t]):>7,} rows')
    v_sla = pd.read_sql('SELECT * FROM public.v_complaint_sla', engine)
    log(f'{"v_complaint_sla":20s}: {len(v_sla):>7,} rows')
    return dfs, v_sla


def build_base_df(dfs, v_sla):
    complaints    = dfs['complaints'].copy()
    categories    = dfs['categories'].copy()
    subcategories = dfs['subcategories'].copy()
    priority_lvl  = dfs['priority_levels'].copy()
    workflow_logs = dfs['workflow_logs'].copy()

    for col in ['created_at', 'updated_at', 'resolved_at', 'closed_at']:
        if col in complaints.columns:
            complaints[col] = pd.to_datetime(complaints[col], errors='coerce')

    complaints['latitude']  = pd.to_numeric(complaints.get('latitude'),  errors='coerce')
    complaints['longitude'] = pd.to_numeric(complaints.get('longitude'), errors='coerce')

    complaints = clean_raw_data(complaints)

    df = complaints.merge(categories[['category_id', 'category_name']], on='category_id', how='left')
    df = df.merge(subcategories[['subcategory_id', 'subcategory_name']], on='subcategory_id', how='left')
    df = df.merge(priority_lvl[['priority_id', 'priority_code']], on='priority_id', how='left')

    sla_label = (
        v_sla[v_sla['is_resolution_breached'].notna()]
        [['complaint_id', 'is_resolution_breached']]
        .rename(columns={'is_resolution_breached': 'sla_breached'})
    )
    df = df.merge(sla_label, on='complaint_id', how='left')

    df['is_resolved'] = df['resolved_at'].notna() | df['closed_at'].notna()
    reject_ids = set(workflow_logs.loc[workflow_logs['action_type'] == 'REJECT', 'complaint_id'])
    df['is_rejected'] = df['complaint_id'].isin(reject_ids)

    df['resolution_hours'] = (
        (df['resolved_at'].fillna(df['closed_at']) - df['created_at'])
        .dt.total_seconds() / 3600
    ).clip(lower=0)

    log(f'Base df: {len(df):,} rows, {df["district"].nunique()} districts')
    return df


def build_district_profile(df):
    top_cats = df['category_name'].value_counts().head(6).index.tolist()

    cat_pivot = (
        df[df['category_name'].isin(top_cats)]
        .groupby(['district', 'category_name'])['complaint_id']
        .count().unstack(fill_value=0)
    )
    cat_pct = cat_pivot.div(cat_pivot.sum(axis=1), axis=0)
    cat_pct.columns = [f'cat_pct_{c.replace(" ", "_")}' for c in cat_pct.columns]

    pri_pivot = (
        df.groupby(['district', 'priority_code'])['complaint_id']
        .count().unstack(fill_value=0)
    )
    pri_pct = pri_pivot.div(pri_pivot.sum(axis=1), axis=0)
    pri_pct.columns = [f'pri_pct_{c}' for c in pri_pct.columns]

    district_stats = (
        df.groupby('district')
        .agg(
            total_complaints=('complaint_id', 'count'),
            resolve_rate=('is_resolved', 'mean'),
            reject_rate=('is_rejected', 'mean'),
            has_coordinates=('latitude', lambda x: x.notna().mean()),
            avg_resolution_hrs=('resolution_hours', lambda x: x[x > 0].median()),
        )
    )

    breach_by_dist = (
        df[df['is_resolved'] & df['sla_breached'].notna()]
        .groupby('district')['sla_breached'].mean()
    )
    global_breach = df.loc[df['is_resolved'] & df['sla_breached'].notna(), 'sla_breached'].mean()
    district_stats['sla_breach_rate'] = breach_by_dist.reindex(district_stats.index).fillna(global_breach)
    district_stats['avg_resolution_hrs'] = district_stats['avg_resolution_hrs'].fillna(
        district_stats['avg_resolution_hrs'].median()
    )

    df['hour'] = df['created_at'].dt.hour
    df['is_weekend'] = (df['created_at'].dt.dayofweek >= 5).astype(int)
    time_stats = df.groupby('district').agg(
        pct_working_hours=('hour', lambda x: ((x >= 8) & (x <= 17)).mean()),
        pct_weekend=('is_weekend', 'mean'),
    )

    cluster_df = (
        district_stats
        .join(cat_pct, how='left')
        .join(pri_pct, how='left')
        .join(time_stats, how='left')
        .fillna(0)
    )
    cluster_df = cluster_df[cluster_df['total_complaints'] >= MIN_COMPLAINTS_PER_DISTRICT].copy()

    log(f'District profile: {cluster_df.shape[0]} districts x {cluster_df.shape[1]} features')
    return cluster_df


def scale_and_weight(cluster_df):
    risk_features   = ['sla_breach_rate', 'resolve_rate', 'reject_rate', 'avg_resolution_hrs']
    volume_features = ['total_complaints']
    mix_features    = [c for c in cluster_df.columns
                        if c.startswith('cat_pct_') or c.startswith('pri_pct_')
                        or c in ('pct_working_hours', 'pct_weekend', 'has_coordinates')]

    def scale_group(cols, weight):
        if not cols:
            return np.empty((len(cluster_df), 0))
        scaler_g = StandardScaler()
        scaled = scaler_g.fit_transform(cluster_df[cols].values)
        return scaled * weight

    x_risk   = scale_group(risk_features,   WEIGHT_RISK)
    x_volume = scale_group(volume_features, WEIGHT_VOLUME)
    x_mix    = scale_group(mix_features,    WEIGHT_MIX)

    x_scaled = np.hstack([x_risk, x_volume, x_mix])
    feature_cols = risk_features + volume_features + mix_features

    scaler_plot = StandardScaler()
    x_plot_scaled = scaler_plot.fit_transform(cluster_df[feature_cols].values)
    pca = PCA(n_components=PCA_COMPONENTS, random_state=42)
    x_pca = pca.fit_transform(x_plot_scaled)
    pca_cols = [f'pc{i + 1}' for i in range(PCA_COMPONENTS)]

    log(f'Weighted feature matrix: {x_scaled.shape}')
    for i, ratio in enumerate(pca.explained_variance_ratio_):
        log(f'PCA (reference only): PC{i + 1}={ratio:.1%}')

    return x_scaled, feature_cols, pca, x_pca, pca_cols


def find_best_k(x_scaled, n_districts):
    k_range = range(2, min(MAX_K + 1, n_districts // 2))
    sil_scores = []
    for k in k_range:
        km = KMeans(n_clusters=k, n_init=20, random_state=42)
        labels = km.fit_predict(x_scaled)
        sil = silhouette_score(x_scaled, labels)
        sil_scores.append(sil)
        log(f'  k={k}: inertia={km.inertia_:.1f}  silhouette={sil:.4f}')

    best_k = list(k_range)[sil_scores.index(max(sil_scores))]
    best_sil = max(sil_scores)
    log(f'Best k = {best_k}  (silhouette={best_sil:.4f})')
    return best_k


def run_dbscan_validation(x_scaled):
    nn = NearestNeighbors(n_neighbors=3).fit(x_scaled)
    distances, _ = nn.kneighbors(x_scaled)
    k_dist = np.sort(distances[:, -1])
    eps_auto = np.percentile(k_dist, 90)
    db = DBSCAN(eps=eps_auto, min_samples=2).fit(x_scaled)
    db_labels = db.labels_
    n_db = len(set(db_labels)) - (1 if -1 in db_labels else 0)
    log(f'DBSCAN validation (eps={eps_auto:.2f}): {n_db} clusters, {(db_labels == -1).sum()} noise points')


def top_overrepresented_category(row, citywide_avg):
    valid_cols = [c for c in citywide_avg.index if citywide_avg[c] >= MIN_CITYWIDE_SHARE]
    if not valid_cols:
        return '—'
    ratios = row[valid_cols] / citywide_avg[valid_cols]
    top_col = ratios.idxmax()
    return top_col.replace('cat_pct_', '').replace('_', ' ')


def describe_cluster(row, profile, citywide_avg_cat):
    parts = []
    if row['sla_breach_rate'] >= 0.50:
        parts.append('SLA Breach สูงมาก (>50%)')
    elif row['sla_breach_rate'] >= 0.35:
        parts.append('SLA Breach ปานกลาง')
    else:
        parts.append('SLA ดี')

    q33 = profile['total_complaints'].quantile(0.33)
    q67 = profile['total_complaints'].quantile(0.67)
    if row['total_complaints'] >= q67:
        parts.append('ปริมาณร้องเรียนสูง')
    elif row['total_complaints'] <= q33:
        parts.append('ปริมาณร้องเรียนต่ำ')

    if row['reject_rate'] >= 0.10:
        parts.append('reject rate สูง')

    q33h = profile['avg_resolution_hrs'].quantile(0.33)
    q67h = profile['avg_resolution_hrs'].quantile(0.67)
    if row['avg_resolution_hrs'] >= q67h:
        parts.append('แก้ไขช้า')
    elif row['avg_resolution_hrs'] <= q33h:
        parts.append('แก้ไขเร็ว')

    top = top_overrepresented_category(row, citywide_avg_cat)
    if top != '—':
        parts.append(f'หมวดเด่น: {top}')
    return ' · '.join(parts)


def build_cluster_meta(cluster_df, profile, k_final, centroids_pca):
    cat_cols_all = [c for c in profile.columns if c.startswith('cat_pct_')]
    citywide_avg_cat = cluster_df[cat_cols_all].mean() if cat_cols_all else pd.Series(dtype=float)

    cluster_meta = []
    for k in range(k_final):
        row = profile.loc[k]
        dists_in = cluster_df[cluster_df['cluster'] == k].index.tolist()
        risk_score = int(np.clip(
            row['sla_breach_rate'] * 50
            + (1 - row['resolve_rate']) * 20
            + row['reject_rate'] * 20
            + min(row['avg_resolution_hrs'] / 200, 1) * 10,
            0, 100
        ))
        top_cat = top_overrepresented_category(row, citywide_avg_cat)
        insight = describe_cluster(row, profile, citywide_avg_cat)

        cluster_meta.append({
            'id': k,
            'label': f'กลุ่ม {k + 1}',
            'color': CLUSTER_COLORS[k % len(CLUSTER_COLORS)],
            'districts': dists_in,
            'category': top_cat,
            'avg_volume': round(row['total_complaints']),
            'risk_score': risk_score,
            'insight': insight,
            'centroid_pca': [float(v) for v in centroids_pca[k]],
        })
        log(f'Cluster {k} (Risk={risk_score}): {len(dists_in)} districts — {insight}')

    return cluster_meta


def write_to_db(database_url, k_final, sil_avg, cluster_df, feature_cols, cluster_meta, pca_cols):
    conn_pg = psycopg2.connect(database_url)
    cur = conn_pg.cursor()

    try:
        cur.execute("""
            SELECT run_id, silhouette_score FROM cluster_model_runs
            WHERE is_active = TRUE ORDER BY trained_at DESC LIMIT 1
        """)
        current_active = cur.fetchone()
        current_active_run_id, current_active_sil = current_active if current_active else (None, None)

        is_better = (current_active_sil is None) or (sil_avg > current_active_sil)

        if is_better:
            cur.execute("UPDATE cluster_model_runs SET is_active = FALSE WHERE is_active = TRUE")

        cur.execute("""
            INSERT INTO cluster_model_runs
                (model_name, k, silhouette_score, n_districts, features_used, is_active, trained_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING run_id
        """, ('K-means', k_final, round(sil_avg, 4), len(cluster_df), len(feature_cols), is_better, datetime.now()))
        run_id = cur.fetchone()[0]

        if is_better:
            if current_active_sil is None:
                log(f'Silhouette {sil_avg:.4f} — no previous active run -> promoting run_id={run_id} to active')
            else:
                log(f'Silhouette {sil_avg:.4f} beats active ({current_active_sil:.4f}) -> '
                    f'promoting run_id={run_id}, replacing run_id={current_active_run_id}')
        else:
            log(f'Silhouette {sil_avg:.4f} does not beat active ({current_active_sil:.4f}) -> '
                f'storing run_id={run_id} as history only')

        cluster_id_map = {}
        for c in cluster_meta:
            cur.execute("""
                INSERT INTO cluster_groups
                    (run_id, cluster_label_no, label, color, top_category, avg_volume, risk_score, insight,
                     centroid_pca)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING cluster_id
            """, (
                run_id, c['id'], c['label'], c['color'],
                c.get('category'), c.get('avg_volume'), c['risk_score'], c.get('insight'),
                c.get('centroid_pca'),
            ))
            cluster_id_map[c['id']] = cur.fetchone()[0]

        district_rows = []
        for cl_no, group in cluster_df.groupby('cluster'):
            cid = cluster_id_map[cl_no]
            for district, row in group.iterrows():
                pca_coords = [float(row[c]) for c in pca_cols] if all(pd.notna(row[c]) for c in pca_cols) else None
                district_rows.append((
                    cid, district,
                    int(row['total_complaints']),
                    float(row['sla_breach_rate']) if pd.notna(row['sla_breach_rate']) else None,
                    float(row['resolve_rate']) if pd.notna(row['resolve_rate']) else None,
                    float(row['avg_resolution_hrs']) if pd.notna(row['avg_resolution_hrs']) else None,
                    pca_coords,
                ))

        psycopg2.extras.execute_values(cur, """
            INSERT INTO cluster_district_map
                (cluster_id, district, total_complaints, sla_breach_rate, resolve_rate, avg_resolution_hrs, pca_coords)
            VALUES %s
        """, district_rows)

        conn_pg.commit()
        log(f'Wrote clustering results to DB: run_id={run_id}, {len(cluster_meta)} clusters, '
            f'{len(district_rows)} district mappings')
    except Exception:
        conn_pg.rollback()
        raise
    finally:
        cur.close()
        conn_pg.close()


def main():
    log('=== Starting complaint clustering training job ===')
    engine = create_engine(DATABASE_URL)

    dfs, v_sla = load_data(engine)
    df = build_base_df(dfs, v_sla)
    cluster_df = build_district_profile(df)

    if len(cluster_df) < 6:
        log(f'Not enough districts with sufficient data ({len(cluster_df)}) to cluster meaningfully. Aborting run.')
        sys.exit(1)

    x_scaled, feature_cols, pca, x_pca, pca_cols = scale_and_weight(cluster_df)

    best_k = find_best_k(x_scaled, len(cluster_df))
    run_dbscan_validation(x_scaled)

    k_final = best_k
    kmeans = KMeans(n_clusters=k_final, n_init=30, max_iter=500, random_state=42)
    cluster_labels = kmeans.fit_predict(x_scaled)
    cluster_df['cluster'] = cluster_labels
    cluster_df[pca_cols] = x_pca

    sil_avg = silhouette_score(x_scaled, cluster_labels)
    log(f'Final K-means k={k_final} | Silhouette={sil_avg:.4f}')

    key_metrics = ['total_complaints', 'resolve_rate', 'reject_rate',
                   'sla_breach_rate', 'avg_resolution_hrs',
                   'pct_working_hours', 'pct_weekend']
    key_metrics += [c for c in cluster_df.columns if c.startswith('cat_pct_')]
    profile = cluster_df.groupby('cluster')[key_metrics].mean().round(3)
    profile['n_districts'] = cluster_df.groupby('cluster').size()

    centroids_pca = pca.transform(kmeans.cluster_centers_)
    cluster_meta = build_cluster_meta(cluster_df, profile, k_final, centroids_pca)

    write_to_db(DATABASE_URL, k_final, sil_avg, cluster_df, feature_cols, cluster_meta, pca_cols)

    log('=== Job finished successfully ===')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        log(f'❌ Job failed: {e}')
        raise
