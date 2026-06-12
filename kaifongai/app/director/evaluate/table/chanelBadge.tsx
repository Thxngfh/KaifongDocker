type Props = {
  app: "Line" | "App" | "Web"
}

export default function ChannelBadge({ app }: Props) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold
        ${app === "Line" && "bg-green-100 text-green-700"}
        ${app === "App" && "bg-blue-100 text-blue-700"}
        ${app === "Web" && "bg-purple-100 text-purple-700"}
      `}
    >
      {app}
    </span>
  )
}