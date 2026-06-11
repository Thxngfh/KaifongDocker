type UserCardProps = {
  name: string;
  lastname: string;
  phone: string;
};
function UserCard({name,lastname,phone}:UserCardProps){

    return (
       <div className=" rounded-xl  bg-white p-3 shadow-sm">

           <div className="flex gap-2 m-3 ">
              <div className="w-1.5 h-6 rounded-md bg-[#725C00] mt-3"></div>
              <div className="">
                <p className="text-lg font-bold text-[#1A1A2E]">ข้อมูลผู้แจ้ง</p>
                <p className="text-sm text-[#4D4632]">Reporter Info</p>
              </div>
           </div>

           <div className="m-3">
                <span className="text-sm font-bold text-[#4D4632]/60">ชื่อ-นามสกุล</span>
                <span className="px-2 text-[10px] text-[#4D4632]/60">Full Name</span>
                <p className="text-md text-[#1A1A2E] font-semibold">{name}{" "}{lastname}</p>  
           </div>

           <div className="m-3">
                <span className="text-sm font-bold text-[#4D4632]/60">เบอร์โทรศัพท์</span>
                <span className="px-2 text-[10px] text-[#4D4632]/60">Phone Number</span>
                <p className="text-md text-[#1A1A2E] font-semibold">{phone}</p>  
           </div>


       </div>

    )
}
export default UserCard;