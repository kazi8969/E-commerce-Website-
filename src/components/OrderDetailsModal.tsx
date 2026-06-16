import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, User, MapPin, Truck, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { FORMAT_CURRENCY } from '../data';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export default function OrderDetailsModal({ isOpen, onClose, order }: OrderDetailsModalProps) {
  if (!isOpen || !order) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl bg-[#111] border border-white/10 text-white shadow-2xl rounded-xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex justify-between items-center bg-[#1a1a1a] p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-[#D4AF37]" size={24} />
                <div>
                  <h2 className="font-serif italic text-2xl font-bold tracking-tight">Order {order.id}</h2>
                  <p className="text-xs text-gray-400 mt-1">{order.date}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              
              {/* Status Banner */}
              <div className={`p-4 rounded-lg border flex items-start gap-4 ${
                order.status === 'Delivered' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                order.status === 'Flagged' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}>
                {order.status === 'Flagged' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-widest">{order.status}</h3>
                  <p className="text-xs mt-1 opacity-80">
                    {order.status === 'Delivered' ? 'This order has been successfully delivered to the customer.' :
                     order.status === 'Flagged' ? 'This order was flagged by the fraud engine and requires review.' :
                     'This order is currently being processed by the system.'}
                  </p>
                </div>
              </div>

              {/* Product Details Section */}
              <div>
                <h3 className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-4 border-b border-white/10 pb-2">Product Details</h3>
                <div className="flex flex-col md:flex-row gap-6">
                  {order.imageUrl ? (
                    <img src={order.imageUrl} alt={order.product} className="w-32 h-40 object-cover rounded-lg border border-white/10" />
                  ) : (
                    <div className="w-32 h-40 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                      <ShoppingBag className="text-gray-600" size={32} />
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-xl font-serif text-white">{order.product}</h4>
                      <p className="text-[#D4AF37] font-mono text-lg mt-1">{FORMAT_CURRENCY(order.amount)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-3 rounded border border-white/10">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Color</p>
                        <p className="text-sm font-bold">{order.color || 'N/A'}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded border border-white/10">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Size</p>
                        <p className="text-sm font-bold">{order.size || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer & Shipping Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-4 border-b border-white/10 pb-2">Customer Info</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User size={16} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-white">{order.customer}</p>
                        <p className="text-xs text-gray-400 mt-1">{order.customerEmail || `${order.customer.replace(' ', '.').toLowerCase()}@example.com`}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{order.phone || '+880 171XXXXXXX'}</p>
                        <div className="flex items-start gap-2 mt-2">
                          <MapPin size={12} className="text-gray-500 mt-0.5" />
                          <p className="text-xs text-gray-400 leading-relaxed">{order.address || 'Address not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-4 border-b border-white/10 pb-2">Shipping & Payment</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Truck size={16} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-white">
                          <span className="text-gray-400">Courier:</span> {order.courier || 'Pending Assignment'}
                        </p>
                        {order.trackingId && (
                          <p className="text-xs text-gray-400 mt-1">Tracking Info: <span className="font-mono text-[#D4AF37]">{order.trackingId}</span></p>
                        )}
                        <p className="text-sm text-white mt-3">
                          <span className="text-gray-400">Payment:</span> {order.paymentMethod || 'Default'}
                        </p>
                        <p className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${order.paymentStatus === 'Paid' ? 'text-emerald-400' : order.paymentStatus === 'Failed' ? 'text-red-400' : 'text-orange-400'}`}>
                          {order.paymentStatus || 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Profile Section */}
              {order.riskScore !== undefined && (
                <div>
                  <h3 className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-4 border-b border-white/10 pb-2">Risk Analysis</h3>
                  <div className={`p-4 rounded-lg border ${order.riskScore > 70 ? 'bg-red-500/5 border-red-500/20' : order.riskScore > 30 ? 'bg-orange-500/5 border-orange-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-mono font-bold text-lg ${order.riskScore > 70 ? 'bg-red-500/20 text-red-500' : order.riskScore > 30 ? 'bg-orange-500/20 text-orange-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                        {order.riskScore}
                      </div>
                      <div>
                        <h4 className="font-bold text-white uppercase tracking-widest text-sm">
                          {order.riskScore > 70 ? 'High Risk' : order.riskScore > 30 ? 'Medium Risk' : 'Low Risk'}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">Machine learning classification based on BD Fraud Network.</p>
                      </div>
                    </div>
                    {Array.isArray(order.riskFactors) && order.riskFactors.length > 0 ? (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Identified Factors</p>
                        <ul className="space-y-2 text-sm">
                          {order.riskFactors.map((factor: string, idx: number) => (
                             <li key={idx} className="flex items-start gap-2">
                               <AlertCircle size={14} className="text-red-500 mt-0.5" />
                               <span className="text-gray-300">{factor}</span>
                             </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Identified Factors</p>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span className="text-sm text-emerald-400">No anomalous patterns detected.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
