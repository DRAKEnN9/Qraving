import { Star, Quote } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Owner, Pizza Paradise',
      image: '👨‍🍳',
      quote: 'QR Menu Manager saved us thousands in printing costs. Orders are faster, customers love it, and we can update prices instantly!',
      rating: 5,
    },
    {
      name: 'Priya Sharma',
      role: 'Manager, Café Delight',
      image: '👩‍💼',
      quote: 'The analytics feature is a game-changer. Now we know exactly which items sell best and when our peak hours are.',
      rating: 5,
    },
    {
      name: 'Amit Patel',
      role: 'Owner, Spice Junction',
      image: '👨‍🍳',
      quote: 'Setup took just 10 minutes! Our customers appreciate the contactless ordering, and UPI payments are instant.',
      rating: 5,
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-orange-50/30 to-white py-24">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5" data-parallax="0.06" data-parallax-dir="up">
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundImage: 'radial-gradient(circle, #f97316 1px, transparent 1px)', 
            backgroundSize: '50px 50px' 
          }}
        ></div>
      </div>

      <div className="container relative mx-auto px-4">
        <div className="mb-20 text-center">
          <div className="mb-4 inline-block reveal-on-scroll" data-reveal-delay="100ms">
            <span className="rounded-full bg-gradient-to-r from-orange-100 to-red-100 px-6 py-2 text-sm font-bold text-orange-700">
              ⭐ TESTIMONIALS
            </span>
          </div>
          <h2 className="mb-6 reveal-on-scroll text-4xl font-black text-gray-900 md:text-5xl lg:text-6xl" data-reveal-delay="150ms">
            Loved by
            <span className="gradient-text"> Restaurant Owners</span>
          </h2>
          <p className="mx-auto max-w-3xl reveal-on-scroll text-xl text-gray-600" data-reveal-delay="250ms">
            Join hundreds of satisfied restaurant owners who transformed their business with QR Menu Manager.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group relative reveal-on-scroll rounded-3xl border-2 border-orange-100 bg-white p-8 shadow-xl transition-all hover:-translate-y-2 hover:border-orange-300 hover:shadow-2xl"
              data-reveal-delay={`${150 * (index + 1)}ms`}
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 left-8">
                <div className="rounded-full bg-gradient-to-br from-orange-500 to-red-600 p-3 shadow-lg">
                  <Quote className="h-6 w-6 text-white" />
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6 mt-4 flex">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 fill-orange-400 text-orange-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="mb-8 text-lg leading-relaxed text-gray-700">&ldquo;{testimonial.quote}&rdquo;</p>

              {/* Author */}
              <div className="flex items-center gap-4 border-t border-orange-100 pt-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-red-100 text-3xl">
                  {testimonial.image}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
