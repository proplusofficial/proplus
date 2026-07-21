import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DynamicItem {
  name: string;
  quantity: number;
}

export const AddOrderModal: React.FC<AddOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { createOrder } = useAuth();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<DynamicItem[]>([{ name: '', quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      showToast('At least one product is required', 'error');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof DynamicItem, value: any) => {
    const newItems = [...items];
    if (field === 'quantity') {
      const q = parseInt(value);
      newItems[index].quantity = isNaN(q) ? 1 : Math.max(1, q);
    } else {
      newItems[index].name = value;
    }
    setItems(newItems);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    }

    items.forEach((item, index) => {
      if (!item.name.trim()) {
        newErrors[`item_${index}`] = "Product name required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createOrder(customerName, items);
      showToast(`Order for ${customerName} added!`, 'success');
      
      // Reset form
      setCustomerName('');
      setItems([{ name: '', quantity: 1 }]);
      setErrors({});
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to add order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl border-t sm:border border-gray-100 dark:border-zinc-800 p-6 z-10 max-h-[90vh] flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-zinc-100">Add New Order</h3>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Create a new customer order</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Customer Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ali Raza"
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-zinc-100 ${
                    errors.customerName 
                      ? 'border-rose-400 dark:border-rose-900/50 focus:ring-rose-500/10 focus:border-rose-500' 
                      : 'border-gray-200 dark:border-zinc-800'
                  }`}
                />
                {errors.customerName && (
                  <p className="text-xs text-rose-500 font-medium pl-1">{errors.customerName}</p>
                )}
              </div>

              {/* Dynamic Products Header */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  Products List
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Product
                </button>
              </div>

              {/* Dynamic Products Inputs */}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="space-y-1.5 p-3.5 bg-gray-50/50 dark:bg-zinc-950/40 rounded-2xl border border-gray-100 dark:border-zinc-850">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Product Name (e.g. Shirt)"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          className={`w-full px-3 py-2 bg-white dark:bg-zinc-950 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all dark:text-zinc-100 ${
                            errors[`item_${index}`] 
                              ? 'border-rose-400 dark:border-rose-900/50' 
                              : 'border-gray-200 dark:border-zinc-800'
                          }`}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-center transition-all dark:text-zinc-100"
                        />
                      </div>
                    </div>
                    {errors[`item_${index}`] && (
                      <p className="text-[10px] text-rose-500 font-medium pl-1">{errors[`item_${index}`]}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-50 dark:bg-zinc-950 hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 font-bold rounded-2xl text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Order'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
