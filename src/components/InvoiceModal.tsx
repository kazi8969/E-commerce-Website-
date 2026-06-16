import React, { useRef } from 'react';
import { ShoppingBag, X, Printer, Download } from 'lucide-react';
import { FORMAT_CURRENCY } from '../data';
import { motion, AnimatePresence } from 'motion/react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export default function InvoiceModal({ isOpen, onClose, order }: InvoiceModalProps) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 print:p-0 print:block print:inset-auto print:fixed">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm print:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white text-black shadow-2xl rounded max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:bg-white print:overflow-visible print:w-full print:max-w-none print:m-0"
          >
            {/* Action Bar (Hidden in Print) */}
            <div className="sticky top-0 z-10 flex justify-between items-center bg-gray-100 p-4 border-b border-gray-200 print:hidden">
              <h2 className="font-bold text-gray-800">Invoice Preview</h2>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded text-xs font-bold uppercase hover:bg-gray-800">
                  <Printer size={14} /> Print
                </button>
                <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded">
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="p-8 sm:p-12 print:p-0">
              <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <ShoppingBag className="text-black" size={24} />
                    <span className="font-serif italic text-2xl font-bold tracking-tight">Elegance</span>
                  </div>
                  <p className="text-gray-500 text-sm">Gulshan Avenue, Dhaka<br/>Bangladesh</p>
                </div>
                <div className="text-right">
                  <h1 className="text-3xl font-light text-gray-300 uppercase tracking-widest mb-2">Invoice</h1>
                  <p className="text-sm font-bold text-gray-800">{order.id.replace('#', 'INV-')}</p>
                  <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex justify-between mb-12">
                <div>
                  <h3 className="text-xs uppercase font-bold tracking-widest text-gray-400 mb-2">Billed To</h3>
                  <p className="font-bold text-gray-800 text-lg">{order.customer}</p>
                  <p className="text-gray-600 text-sm mt-1">{order.customer.replace(' ', '.').toLowerCase()}@example.com</p>
                  <p className="text-gray-600 text-sm">+880 171XXXXXXX</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-gray-400 mb-2">Payment Status</h3>
                  <p className="font-bold text-gray-800">{order.paymentMethod || 'Default'}</p>
                  <span className={`inline-block mt-1 px-2 py-1 text-[10px] uppercase font-bold tracking-widest border rounded ${order.paymentStatus === 'Paid' ? 'border-green-200 text-green-700 bg-green-50' : 'border-red-200 text-red-700 bg-red-50'}`}>
                    {order.paymentStatus || 'Pending'}
                  </span>
                </div>
              </div>

              <table className="w-full text-left mb-12">
                <thead>
                  <tr className="border-b-2 border-black text-xs uppercase tracking-widest font-bold">
                    <th className="py-3 text-gray-800">Description</th>
                    <th className="py-3 text-gray-800 text-right">Qty</th>
                    <th className="py-3 text-gray-800 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-4 text-gray-800">{order.product}</td>
                    <td className="py-4 text-gray-800 text-right">1</td>
                    <td className="py-4 text-gray-800 text-right font-mono">{FORMAT_CURRENCY(order.amount)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end mb-16">
                <div className="w-1/2">
                  <div className="flex justify-between py-2 text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-mono text-gray-800">{FORMAT_CURRENCY(order.amount)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm text-gray-600 border-b border-gray-200">
                    <span>Shipping</span>
                    <span className="font-mono text-gray-800">Free</span>
                  </div>
                  <div className="flex justify-between py-4 text-lg font-bold text-gray-900 border-b-2 border-black">
                    <span>Total</span>
                    <span className="font-mono">{FORMAT_CURRENCY(order.amount)}</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
                <p>Thank you for choosing Elegance. If you have any questions, contact billing@elegance.ex</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
