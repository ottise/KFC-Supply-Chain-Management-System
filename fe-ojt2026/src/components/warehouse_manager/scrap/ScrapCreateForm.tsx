
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Package } from 'lucide-react';
import type { CreateScrapOrderRequest, InventoryCheck, ScrapOrderDetail } from '@/types/warehouse/scrap';
import { locationsApi } from '@/lib/api/warehouse/locationsApi';
import { productsApi } from '@/lib/api/warehouse/productsApi';
import { productLotsApi } from '@/lib/api/warehouse/productLotsApi';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import type { Location } from '@/types/warehouse/locations';
import type { Product } from '@/types/warehouse/masterData';
import type { ProductLot } from '@/types/warehouse/productLot';
import OdooDropdown from '@/components/common/OdooDropdown';
import { useToast } from '@/components/ui/ToastProvider';

interface Props {
  initialData?: ScrapOrderDetail | null;
  onClose: () => void;
  onSave: (data: CreateScrapOrderRequest) => Promise<{ success: boolean; failData?: InventoryCheck[] }>;
  actionLoading: boolean;
}

const MAX_REASON_LENGTH = 500;
const ALLOWED_REASON_REGEX = /^[\p{L}\p{N}\s.,\-]+$/u;

const scrapDropdownTrigger = '!h-9 !min-h-[2.25rem] !rounded-lg !border !border-gray-100 !bg-gray-50/60 !px-3 !text-[10px] !font-semibold !text-gray-800 !shadow-[0_1px_2px_rgb(15_23_42_/_0.04),0_3px_10px_-4px_rgb(15_23_42_/_0.07)]';
const scrapTextInput = 'w-full h-9 rounded-lg border border-gray-100 bg-gray-50/60 kfc-form-field-shadow px-3 text-[10px] font-semibold text-gray-800 outline-none focus:border-red-100/50 focus:bg-white focus:ring-2 focus:ring-red-50/25 transition-all placeholder:text-gray-400';

const ScrapCreateForm = ({ initialData, onClose, onSave, actionLoading }: Props) => {
  const { user } = useAuthContext();
  const toast = useToast();
  const notifyFormError = (detail: string) => toast.error('Thông tin chưa hợp lệ', detail);
  const notifySuccess = (detail: string) => toast.success('Thao tác thành công', detail);
  const [formData, setFormData] = useState({
    warehouseId: initialData?.WarehouseId || 0,
    locationId: initialData?.LocationId || 0,
    productId: initialData?.Items?.[0]?.ProductId || 0,
    quantity: initialData?.Items?.[0]?.Quantity || 0,
    uomId: initialData?.Items?.[0]?.UomId || 0,
    lotId: initialData?.Items?.[0]?.LotId || 0,
    reason: initialData?.Items?.[0]?.Reason || '',
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allLots, setAllLots] = useState<ProductLot[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingLots, setLoadingLots] = useState(false);
  const [quantityInput, setQuantityInput] = useState(
    initialData?.Items?.[0]?.Quantity != null ? String(initialData.Items[0].Quantity) : ''
  );

  // Lots are already filtered by API with locationId + productId
  const filteredLots = useMemo(() => allLots, [allLots]);

  useEffect(() => {
    if (!user) return;
    const loadMasterData = async () => {
      setLoadingData(true);
      try {
        let managerId: number | undefined = undefined;
        if (user?.role === 'Manager') {
          const rawId = user.id ? parseInt(user.id) : NaN;
          if (!isNaN(rawId)) managerId = rawId;
        }
        const locRes = await locationsApi.getLocations({ managerId, pageSize: 100, isActive: true });
        setLocations(locRes.Items || []);
        setProducts([]);
        setAllLots([]);
      } catch (err) {
        console.error('Failed to load form master data:', err);
        notifyFormError('Không thể tải dữ liệu biểu mẫu. Vui lòng thử lại trong giây lát.');
      } finally {
        setLoadingData(false);
      }
    };
    loadMasterData();
  }, [user]);

  const handleLocationChange = (selectedLoc: Location | null) => {
    const locId = selectedLoc?.Id || 0;
    setFormData(prev => ({
      ...prev,
      locationId: locId,
      warehouseId: selectedLoc?.WarehouseId || 0,
      productId: 0,
      uomId: 0,
      lotId: 0,
    }));
    setProducts([]);
    setAllLots([]);
  };

  const handleProductChange = (selectedProd: Product | null) => {
    const prodId = selectedProd?.Id || 0;
    setFormData(prev => ({
      ...prev,
      productId: prodId,
      uomId: selectedProd?.BaseUomId || 0,
      lotId: 0,
    }));
  };

  const selectedProduct = products.find(p => p.Id === formData.productId);
  const selectedLocation = locations.find(l => l.Id === formData.locationId);
  const selectedLot = filteredLots.find(l => l.Id === formData.lotId);

  useEffect(() => {
    const loadProductsByLocation = async () => {
      if (!formData.locationId) { setProducts([]); return; }
      try {
        const productsByLocation = await productsApi.getProductsByLocation(formData.locationId);
        setProducts(productsByLocation || []);
      } catch (err) {
        console.error('Failed to load products by location:', err);
        setProducts([]);
      }
    };
    loadProductsByLocation();
  }, [formData.locationId]);

  useEffect(() => {
    const loadLotsByLocation = async () => {
      if (!formData.locationId || !formData.productId) { setAllLots([]); return; }
      setLoadingLots(true);
      try {
        const lotsByLocation = await productLotsApi.getLotsByLocationAndProductId(formData.locationId, formData.productId);
        setAllLots(lotsByLocation || []);
      } catch (err) {
        console.error('Failed to load lots by location + product:', err);
        setAllLots([]);
      } finally {
        setLoadingLots(false);
      }
    };
    loadLotsByLocation();
  }, [formData.locationId, formData.productId]);

  const handleSubmit = async () => {
    if (!formData.locationId || !formData.productId || !formData.uomId || !formData.lotId) {
      notifyFormError('Vui lòng hoàn thiện đầy đủ các trường thông tin bắt buộc.');
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      notifyFormError('Số lượng tiêu hủy phải là giá trị lớn hơn 0.');
      return;
    }
    const normalizedReason = formData.reason.replace(/\s+/g, ' ').trim();
    if (!normalizedReason) {
      notifyFormError('Vui lòng nhập lý do cho yêu cầu tiêu hủy.');
      return;
    }
    if (normalizedReason.length > MAX_REASON_LENGTH) {
      notifyFormError(`Lý do tiêu hủy không được vượt quá ${MAX_REASON_LENGTH} ký tự.`);
      return;
    }
    if (!ALLOWED_REASON_REGEX.test(normalizedReason)) {
      notifyFormError('Lý do chỉ được phép gồm chữ, số, khoảng trắng, dấu chấm (.) và dấu phẩy (,).');
      return;
    }

    const request: CreateScrapOrderRequest = {
      WarehouseId: formData.warehouseId,
      LocationId: formData.locationId,
      Item: {
        ProductId: formData.productId,
        Quantity: formData.quantity,
        UomId: formData.uomId,
        LotId: formData.lotId,
        Reason: normalizedReason,
      },
    };
    const res = await onSave(request);
    if (res.success) {
      notifySuccess(initialData ? 'Đã cập nhật phiếu tiêu hủy.' : 'Đã tạo phiếu tiêu hủy.');
      onClose();
    }
  };

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" aria-hidden="true" />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-2 sm:p-3 animate-in zoom-in-95 duration-200 pointer-events-none overflow-hidden">
        <div className="bg-white rounded-[1.5rem] border border-[#E4002B]/20 shadow-sm w-[720px] max-w-[94vw] max-h-[92vh] flex flex-col pointer-events-auto overflow-hidden animate-in fade-in duration-300 my-auto">

          {/* ── Header đỏ ── */}
          <div className="relative z-[2] shrink-0 px-3.5 py-1.5 border-b border-[#b30022] bg-[#E4002B] text-white flex flex-col gap-0.5 shadow-[0_6px_18px_-8px_rgba(120,0,20,0.35)]">
            <div className="flex flex-col items-center text-center">
              <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">
                Phiếu tiêu hủy phế phẩm
              </p>
              <h2 className="text-[15px] md:text-base font-black text-white uppercase tracking-tight mt-0.5">
                {initialData ? 'Cập nhật lệnh loại bỏ hàng' : 'Tạo lệnh loại bỏ hàng'}
              </h2>
              <p className="text-[9px] font-black text-white/80 uppercase tracking-[0.12em] mt-0.5">
                Hệ thống quản lý phế phẩm &amp; tiêu hủy
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2 right-5 shrink-0 p-2.5 rounded-xl border border-white/30 bg-white/10 text-white hover:bg-white/20 transition-all"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Body 2 cột ── */}
          <div className="flex-1 min-h-0 px-3 py-1.5 sm:px-3.5 overflow-hidden bg-white flex flex-col gap-1">

            {loadingData ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-4">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đang tải biểu mẫu...</p>
              </div>
            ) : (
              <div className="flex-1 min-h-0 grid min-w-0 grid-cols-1 gap-2.5 overflow-hidden">

                {/* LEFT: Form fields (scroll) */}
                <div className="min-h-0 min-w-0 rounded-[1.1rem] border border-gray-100 bg-white p-2 flex flex-col gap-2 shadow-sm shadow-gray-200/30">

                  {/* Nguồn hàng */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 pb-1.5 border-b border-gray-100">
                      <div className="w-1.5 h-5 bg-[#E4002B] rounded-full" />
                      <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Nguồn hàng</h3>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                        Khu vực lấy hàng (Source Location) *
                      </label>
                      <OdooDropdown<Location>
                        items={locations.filter(loc => loc.IsActive)}
                        value={locations.find(loc => loc.Id === formData.locationId) || null}
                        onChange={handleLocationChange}
                        displayField="Name"
                        placeholder="Chọn khu vực nguồn..."
                        className="w-full"
                        triggerClassName={scrapDropdownTrigger}
                        listMaxHeight="max-h-56"
                        portal
                      />
                    </div>
                  </div>

                  {/* Chi tiết hàng hóa */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 pb-1.5 border-b border-gray-100">
                      <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Chi tiết hàng hóa</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_170px] gap-2 sm:items-end">
                      <div className="space-y-1.5 min-w-0">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                          Sản phẩm *
                        </label>
                        <OdooDropdown<Product>
                          items={products}
                          value={products.find(prod => prod.Id === formData.productId) || null}
                          onChange={handleProductChange}
                          displayField="Name"
                          placeholder={formData.locationId ? 'Chọn sản phẩm...' : 'Chọn khu vực trước'}
                          className="w-full"
                          triggerClassName={scrapDropdownTrigger}
                          listMaxHeight="max-h-56"
                          disabled={!formData.locationId}
                          portal
                        />
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                          Số lượng tiêu hủy *
                        </label>
                        <div className="grid h-9 w-full grid-cols-2 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
                          <input
                            type="text"
                            inputMode="decimal"
                            className="h-full w-full bg-transparent px-1.5 text-center text-[11px] font-black tabular-nums text-gray-900 outline-none"
                            placeholder="0.00"
                            value={quantityInput}
                            onChange={(e) => {
                              const input = e.target.value;
                              if (input && !/^\d*([.,]\d*)?$/.test(input)) return;
                              setQuantityInput(input);
                              if (input === '' || input === '.' || input === ',') {
                                setFormData({ ...formData, quantity: 0 });
                                return;
                              }
                              const numeric = Number(input.replace(',', '.'));
                              if (!Number.isNaN(numeric)) setFormData({ ...formData, quantity: numeric });
                            }}
                            onBlur={() => {
                              if (!quantityInput || quantityInput === '.' || quantityInput === ',') {
                                setQuantityInput('');
                                return;
                              }
                              const numeric = Number(quantityInput.replace(',', '.'));
                              if (!Number.isNaN(numeric)) {
                                setQuantityInput(numeric.toLocaleString('vi-VN', { maximumFractionDigits: 6 }));
                              }
                            }}
                          />
                          <div className="flex min-w-0 items-center justify-center border-l border-gray-100 bg-gray-50/50 px-1 text-center text-[9px] font-black uppercase leading-tight text-gray-500">
                            {selectedProduct?.BaseUomName || 'ĐVT'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                        Số lô (Product Lot) *
                      </label>
                      <OdooDropdown<ProductLot>
                        items={filteredLots}
                        value={filteredLots.find(lot => lot.Id === formData.lotId) || null}
                        onChange={(lot) => setFormData({ ...formData, lotId: lot?.Id || 0 })}
                        displayField="LotNumber"
                        placeholder={
                          !formData.locationId ? 'Vui lòng chọn khu vực nguồn trước'
                          : !formData.productId ? 'Vui lòng chọn sản phẩm trước'
                          : loadingLots ? 'Đang tải số lô...'
                          : 'Chọn số lô từ kho...'
                        }
                        className="w-full"
                        triggerClassName={scrapDropdownTrigger}
                        listMaxHeight="max-h-56"
                        disabled={!formData.productId || loadingLots}
                        portal
                      />
                    </div>
                  </div>

                  {/* Lý do tiêu hủy */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                      <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Lý do tiêu hủy</h3>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                        Chi tiết lý do *
                      </label>
                      <textarea
                        className="w-full bg-gray-50/50 border border-gray-100 kfc-form-field-shadow px-3 py-2.5 rounded-[0.9rem] text-[10px] font-semibold text-gray-800 focus:border-red-100/50 focus:bg-white focus:ring-2 focus:ring-red-50/25 outline-none transition-all min-h-[74px] resize-none placeholder:text-gray-400"
                        placeholder="VD: Hàng hết hạn sử dụng, bao bì hư hỏng, sản phẩm không đạt chất lượng..."
                        maxLength={MAX_REASON_LENGTH}
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      />

                    </div>
                  </div>
                </div>

                {/* Summary card đỏ + nút submit */}
                <div className="shrink-0 w-full">
                  <div className="w-full rounded-[1rem] bg-gradient-to-b from-[#ff2b4f] to-[#d10025] text-white px-2.5 py-2 flex flex-col gap-1.5 box-border min-w-0">
                    <div className="shrink-0 border-b border-white/20 pb-1.5 flex items-start justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">TÓM TẮT</p>
                      <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">
                        {initialData ? 'Cập nhật' : 'Tạo mới'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 text-[9px] font-bold leading-tight shrink-0">
                      <div className="flex gap-2 items-baseline min-w-0">
                        <span className="shrink-0 w-3 text-center text-white font-black leading-none pt-px select-none" aria-hidden>•</span>
                        <div className="flex flex-1 min-w-0 justify-between gap-2">
                          <span className="text-white/80 uppercase">Sản phẩm</span>
                          <span className="text-white tabular-nums truncate max-w-[55%] text-right">{selectedProduct?.Name || '—'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 items-baseline min-w-0">
                        <span className="shrink-0 w-3 text-center text-white font-black leading-none pt-px select-none" aria-hidden>•</span>
                        <div className="flex flex-1 min-w-0 justify-between gap-2">
                          <span className="text-white/80 uppercase">Số lượng</span>
                          <span className="text-white tabular-nums">{formData.quantity > 0 ? `${formData.quantity} ${selectedProduct?.BaseUomName || ''}` : '—'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 items-baseline min-w-0">
                        <span className="shrink-0 w-3 text-center text-white font-black leading-none pt-px select-none" aria-hidden>•</span>
                        <div className="flex flex-1 min-w-0 justify-between gap-2">
                          <span className="text-white/80 uppercase">Số lô</span>
                          <span className="text-white font-mono truncate max-w-[55%] text-right">{selectedLot?.LotNumber || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1.5 border-t border-white/15">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={actionLoading}
                        className="w-full min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {actionLoading
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
                          : <Package className="w-3.5 h-3.5 text-current" />
                        }
                        {initialData ? 'Cập nhật yêu cầu' : 'Xác nhận tạo lệnh'}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default ScrapCreateForm;