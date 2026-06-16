import React from 'react';
import { Eye, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { FORMAT_CURRENCY } from '../data';

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  onAddToCart: (product: Product) => void;
  onTryOnClick: (product: Product) => void;
  onViewProduct?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onViewProduct }: ProductCardProps) {
  return (
    <div 
      className="group flex flex-col bg-white overflow-hidden border border-gray-100 hover:border-gray-200 transition-all duration-300 relative"
    >
      {/* Discount Badge */}
      {product.originalPrice && product.originalPrice > product.price && (
         <div className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold">
            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
         </div>
      )}

      {/* Image Container */}
      <div 
        className="relative aspect-square overflow-hidden bg-white cursor-pointer flex items-center justify-center p-6 border-b border-gray-50"
        onClick={() => onViewProduct && onViewProduct(product)}
      >
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
        />

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-transparent flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
          <button 
            onClick={(e) => { e.stopPropagation(); onViewProduct && onViewProduct(product); }}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-md hover:bg-blue-600 hover:text-white transition-colors pointer-events-auto"
            title="Quick View"
          >
            <Eye size={18} />
          </button>
        </div>
      </div>

      {/* Details */}
      <div 
        className="p-5 flex flex-col cursor-pointer relative"
        onClick={() => onViewProduct && onViewProduct(product)}
      >
        <div className="text-[10px] text-gray-400 mb-1 font-medium">{product.category || 'Audio Speakers'}</div>
        <h3 className="text-sm font-bold text-gray-800 leading-tight mb-2 line-clamp-1">{product.name}</h3>
        
        <div className="flex justify-between items-center mt-auto">
           <div className="flex items-baseline gap-2">
             <span className="font-bold text-red-600 text-sm">{FORMAT_CURRENCY(product.price)}</span>
             {product.originalPrice && (
               <span className="text-xs text-gray-400 line-through">{FORMAT_CURRENCY(product.originalPrice)}</span>
             )}
           </div>
           
           <button 
             onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
             className="text-gray-400 hover:text-blue-600 transition-colors"
           >
             <Eye size={16} /> {/* The image uses an eye icon next to price for some reason, maybe as an action? Let's use it as in the design */}
           </button>
        </div>
      </div>
    </div>
  );
}
