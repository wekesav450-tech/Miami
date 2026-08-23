import React from 'react';
import { MapPin, Phone, Clock, UtensilsCrossed, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';

export const AboutLocation: React.FC = () => {
  return (
    <section id="about" className="py-16 bg-[#F3F2EE] text-[#1A1A1A] border-b-2 border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider mb-3 shadow-[2px_2px_0px_0px_#1A1A1A]">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Naivasha Heritage & Hospitality</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1A1A1A] tracking-tight">
            About New Miami Restaurant
          </h2>
          <p className="mt-3 text-stone-700 text-sm sm:text-base font-medium">
            Nestled in the heart of scenic Naivasha, Kenya, bringing together authentic Kenyan culinary passion and world-class continental dining.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Visual Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative rounded-3xl overflow-hidden border-2 border-[#1A1A1A] shadow-[8px_8px_0px_0px_#1A1A1A]">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
                alt="New Miami Restaurant Dining Room & Ambiance"
                className="w-full h-80 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 bg-white p-3.5 rounded-xl border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#1A1A1A]">Serene Dining & Garden Terrace</h4>
                    <p className="text-[11px] text-amber-800 font-semibold">Naivasha, Nakuru County, Kenya</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">Open Daily</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] text-center">
                <span className="text-2xl font-serif font-bold text-[#1A1A1A]">100%</span>
                <p className="text-xs text-stone-800 font-bold mt-1">Fresh Farm-to-Table</p>
                <p className="text-[10px] text-stone-600 font-medium">Local Naivasha ingredients</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] text-center">
                <span className="text-2xl font-serif font-bold text-[#1A1A1A]">7 Days</span>
                <p className="text-xs text-stone-800 font-bold mt-1">8 AM – 11 PM</p>
                <p className="text-[10px] text-stone-600 font-medium">Fast doorstep delivery</p>
              </div>
            </div>
          </div>

          {/* Right Narrative & Info Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <h3 className="text-2xl font-serif font-bold text-[#1A1A1A]">
                The Heart of Authentic Kenyan & Continental Flavor
              </h3>
              <p className="text-sm text-stone-700 leading-relaxed font-medium">
                At <strong className="text-[#1A1A1A] underline decoration-amber-500 underline-offset-2">New Miami Restaurant</strong>, we take pride in celebrating Kenyan culinary tradition while serving sophisticated continental favourites. Whether you crave tender, slow-roasted goat ribs (<em className="text-amber-900 font-semibold">Mbuzi Nyama Choma</em>), freshly caught whole <em className="text-amber-900 font-semibold">Lake Naivasha Tilapia</em> tossed in rich coriander gravy, or a mouthwatering gourmet bacon-cheddar beef burger with crispy masala chips, every meal is prepared fresh on order.
              </p>
              <p className="text-sm text-stone-700 leading-relaxed font-medium">
                We cater to family celebrations, weekend getaways to Lake Naivasha, corporate lunch events, and speedy home deliveries across Naivasha town.
              </p>
            </div>

            {/* Quick Details Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] space-y-1.5">
                <div className="flex items-center gap-2 text-[#1A1A1A]">
                  <MapPin className="w-4 h-4 text-amber-700" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1A1A1A]">Our Location</h4>
                </div>
                <p className="text-xs text-stone-700 font-bold">
                  Naivasha, Nakuru County, Kenya
                </p>
                <p className="text-[11px] text-stone-600 font-medium">Near Lake Naivasha / Moi South Lake Corridor</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] space-y-1.5">
                <div className="flex items-center gap-2 text-[#1A1A1A]">
                  <Phone className="w-4 h-4 text-amber-700" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1A1A1A]">Contact & Orders</h4>
                </div>
                <p className="text-xs font-mono font-bold text-[#1A1A1A]">
                  0741775878
                </p>
                <p className="text-[11px] text-stone-600 font-medium">Available on Call & WhatsApp for orders & reservations</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] space-y-1.5">
                <div className="flex items-center gap-2 text-[#1A1A1A]">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1A1A1A]">Service Hours</h4>
                </div>
                <p className="text-xs text-stone-700 font-bold">
                  Monday – Sunday: 8:00 AM – 11:00 PM
                </p>
                <p className="text-[11px] text-stone-600 font-medium">Breakfast, Lunch, Dinner & Late Night Grills</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] space-y-1.5">
                <div className="flex items-center gap-2 text-[#1A1A1A]">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1A1A1A]">M-Pesa Pochi</h4>
                </div>
                <p className="text-xs font-mono font-bold text-[#1A1A1A]">
                  0741775878
                </p>
                <p className="text-[11px] text-stone-600 font-medium">Account Name: New Miami Restaurant</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
