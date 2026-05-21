"use client"

export default function HRFormModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-[850px] rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
        
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Thiết lập <span className="text-[#E4002B]">Nhân sự mới</span></h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Cấp quyền truy cập hệ thống KFC Warehouse</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-black font-bold transition-colors">✕ Đóng</button>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          {/* Thông tin định danh */}
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-2 block">Tên nhân sự</label>
              <input type="text" placeholder="VD: Kasimada" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#E4002B]/20 outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-2 block">Email đăng nhập (Login)</label>
              <input type="email" placeholder="email@kfc.com.vn" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#E4002B]/20 outline-none" />
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-2 block">Số điện thoại</label>
              <input type="text" placeholder="+84 ..." className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#E4002B]/20 outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-2 block">Vai trò (Role)</label>
              <div className="flex gap-4 p-2 bg-gray-50 rounded-2xl">
                <label className="flex-1 flex items-center justify-center gap-2 py-2 bg-white rounded-xl shadow-sm cursor-pointer">
                  <input type="radio" name="role" className="accent-[#E4002B]" defaultChecked />
                  <span className="text-xs font-bold">Người dùng</span>
                </label>
                <label className="flex-1 flex items-center justify-center gap-2 py-2 cursor-pointer">
                  <input type="radio" name="role" className="accent-[#E4002B]" />
                  <span className="text-xs font-bold text-gray-400">Quản trị viên</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Phân quyền chi tiết (Access Rights) */}
        <div className="border-t border-dashed border-gray-200 pt-8">
          <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-6">Phân quyền phân hệ</h3>
          <div className="grid grid-cols-2 gap-6">

            {/* Cột 1 */}
            <div className="space-y-4">
              <div className="p-5 bg-gray-900 rounded-2xl">
                 <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-2">Bán hàng (Sales)</label>
                 <select 
                    defaultValue="User: All Documents" 
                    className="bg-transparent text-white text-sm font-bold outline-none w-full cursor-pointer"
                 >
                   <option className="text-black" value="No">Không có quyền</option>
                   <option className="text-black" value="User: Own Documents Only">Chỉ tài liệu cá nhân</option>
                   <option className="text-black" value="User: All Documents">Tất cả tài liệu</option>
                   <option className="text-black" value="Administrator">Quản trị viên</option>
                 </select>
              </div>
              <div className="p-5 bg-gray-100 rounded-2xl">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Kho hàng (Inventory)</label>
                 <select 
                    defaultValue="Administrator" 
                    className="bg-transparent text-gray-800 text-sm font-bold outline-none w-full cursor-pointer"
                 >
                   <option value="No">Không có quyền</option>
                   <option value="User">Người dùng</option>
                   <option value="Administrator">Quản trị viên</option>
                 </select>
              </div>
            </div>

            {/* Cột 2 */}
            <div className="space-y-4">
              <div className="p-5 bg-gray-100 rounded-2xl">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Sản phẩm (Master Data)</label>
                 <select 
                    defaultValue="Tạo mới" 
                    className="bg-transparent text-gray-800 text-sm font-bold outline-none w-full cursor-pointer"
                 >
                   <option value="Chỉ xem">Chỉ xem (View)</option>
                   <option value="Tạo mới">Tạo mới (Create)</option>
                 </select>
              </div>
              <div className="p-5 bg-gray-100 rounded-2xl">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Bảng điều khiển (Productivity)</label>
                 <select 
                    defaultValue="Admin" 
                    className="bg-transparent text-gray-800 text-sm font-bold outline-none w-full cursor-pointer"
                 >
                   <option value="No">Không có quyền</option>
                   <option value="Admin">Quản trị viên (Admin)</option>
                 </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-12">
          <button onClick={onClose} className="px-8 py-4 text-xs font-black uppercase text-gray-400 hover:text-gray-900 transition-all">Huỷ bỏ</button>
          <button className="px-10 py-4 bg-[#E4002B] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-red-100 hover:scale-105 active:scale-95 transition-all">
            Lưu & Gửi lời mời
          </button>
        </div>
      </div>
    </div>
  )
}