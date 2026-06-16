import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { ChevronRight, Filter } from 'lucide-react';

interface ShopViewProps {
  products: Product[];
  initialCategory?: string;
  initialSearch?: string;
  onAddToCart: (product: Product, quantity?: number, options?: any) => void;
  onTryOnClick: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  categories: any[];
}

export default function ShopView({ products, initialCategory, initialSearch, onAddToCart, onTryOnClick, onViewProduct, categories }: ShopViewProps) {
  const [category, setCategory] = useState(initialCategory || '');
  const [search, setSearch] = useState(initialSearch || '');
  const [sort, setSort] = useState('newest');

  const filteredProducts = useMemo(() => {
    let res = products;
    if (category) {
      res = res.filter(p => p.category?.toLowerCase() === category.toLowerCase() || p.description?.toLowerCase().includes(category.toLowerCase()) || p.name.toLowerCase().includes(category.toLowerCase())); 
    }
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    if (sort === 'price-low') res.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') res.sort((a, b) => b.price - a.price);
    return res;
  }, [products, category, search, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 min-h-screen">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Filter size={18} /> Filters</h3>
            
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Categories</h4>
              <div className="space-y-2">
                <button onClick={() => setCategory('')} className={`block text-sm text-left w-full ${!category ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-blue-600'}`}>All Categories</button>
                {categories.map((c, i) => (
                  <button key={i} onClick={() => setCategory(c.name)} className={`block text-sm text-left w-full ${category === c.name ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-blue-600'}`}>{c.name}</button>
                ))}
              </div>
            </div>
            
            {search && (
              <div className="mb-6 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-700 mb-2">Active Search</h4>
                <div className="flex items-center justify-between text-xs bg-gray-100 px-3 py-2 rounded">
                   <span className="truncate">"{search}"</span>
                   <button onClick={() => setSearch('')} className="text-gray-500 hover:text-red-500 font-bold ml-2">X</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {search ? `Search results for "${search}"` : category ? category : 'All Products'}
              <span className="text-sm font-normal text-gray-500 ml-2">({filteredProducts.length} items)</span>
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
               <span className="text-sm text-gray-500 whitespace-nowrap">Sort by:</span>
               <select value={sort} onChange={e => setSort(e.target.value)} className="w-full sm:w-auto text-sm border border-gray-200 rounded-md p-1.5 outline-none focus:border-blue-500 bg-white">
                 <option value="newest">Newest Arrivals</option>
                 <option value="price-low">Price: Low to High</option>
                 <option value="price-high">Price: High to Low</option>
               </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onTryOnClick={onTryOnClick}
                  onViewProduct={onViewProduct}
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500 bg-white border border-gray-100 rounded-xl">
                 <p className="mb-4 text-lg">No products found matching your criteria.</p>
                 <button onClick={() => { setCategory(''); setSearch(''); }} className="px-6 py-2 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition-colors">Clear filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
