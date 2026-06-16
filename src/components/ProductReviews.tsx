import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../lib/firebase';
import { ProductReview, Product } from '../types';
import { Star, MessageSquare } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const q = query(
      collection(db, 'products', productId, 'reviews'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews: ProductReview[] = [];
      snapshot.forEach(doc => {
        fetchedReviews.push({ id: doc.id, ...doc.data() } as ProductReview);
      });
      setReviews(fetchedReviews);
      setLoading(false);
    }, (error) => {
      console.error('Failed to fetch reviews:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [productId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert('Please sign in to submit a review.');
    
    setSubmitting(true);
    try {
      // 1. Add the review to subcollection
      const newReview = {
        productId,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        rating: userRating,
        comment: userComment,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'products', productId, 'reviews'), newReview);
      
      setUserComment('');
      setUserRating(5);
    } catch (error) {
      console.error('Failed to add review:', error);
      alert('Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingDistribution = [5, 4, 3, 2, 1].map(r => ({
    stars: r,
    count: reviews.filter(rev => rev.rating === r).length
  }));

  return (
    <section className="mt-24 border-t border-white/10 pt-24 pb-12">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-serif text-3xl md:text-5xl italic mb-12 text-center">Customer Reviews</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 bg-[#111] p-8 rounded-2xl border border-white/5 mb-12">
          {/* Summary */}
          <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 pb-8 md:pb-0 md:pr-8">
            <div className="text-6xl font-serif italic text-white mb-2">{avgRating}</div>
            <div className="flex text-[#D4AF37] mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className={i < Math.round(Number(avgRating)) ? 'fill-[#D4AF37]' : 'text-gray-600'} />
              ))}
            </div>
            <p className="text-gray-400 text-sm">Based on {reviews.length} reviews</p>
          </div>
          
          {/* Distribution */}
          <div className="md:col-span-8 flex flex-col justify-center space-y-3">
            {ratingDistribution.map(({ stars, count }) => (
              <div key={stars} className="flex items-center gap-4 text-sm">
                <div className="w-12 text-gray-400">{stars} Stars</div>
                <div className="flex-1 h-2 bg-black rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#D4AF37] rounded-full" 
                    style={{ width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="w-8 text-right text-gray-500">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Review Form */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-4 font-serif italic">Write a Review</h3>
          {currentUser ? (
            <form onSubmit={handleSubmitReview} className="bg-[#111] p-6 rounded-xl border border-white/10">
              <div className="mb-4">
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Rating</label>
                <div className="flex gap-2 text-[#D4AF37]">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setUserRating(star)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star size={24} className={star <= userRating ? 'fill-[#D4AF37]' : 'text-gray-600'} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Your Comment</label>
                <textarea 
                  required
                  value={userComment}
                  onChange={e => setUserComment(e.target.value)}
                  className="w-full bg-black border border-white/20 rounded p-4 text-white focus:outline-none focus:border-[#D4AF37] min-h-[120px]"
                  placeholder="Share your thoughts about this product..."
                />
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="bg-white text-black px-6 py-3 font-bold uppercase tracking-widest text-xs rounded hover:bg-[#D4AF37] transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <div className="bg-black/50 p-6 rounded-xl border border-white/10 text-center text-gray-400 text-sm">
              Please sign in to leave a review.
            </div>
          )}
        </div>

        {/* Review List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center bg-[#111] p-12 rounded-xl border border-white/5 border-dashed">
              <MessageSquare size={32} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">Be the first to review this product!</p>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="bg-[#111] p-6 rounded-xl border border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white uppercase">
                      {review.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{review.userName}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex text-[#D4AF37]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < review.rating ? 'fill-[#D4AF37]' : 'text-gray-600'} />
                    ))}
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
