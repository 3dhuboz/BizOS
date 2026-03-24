import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Package, MapPin, Phone, Mail, Clock, Users, Star } from 'lucide-react';

const VendorPack: React.FC = () => {
  const { settings, menu, getLabel, businessConfig, galleryPosts } = useApp();

  const cateringItems = menu.filter(m => m.availableForCatering || m.category === 'Catering Packs');
  const packages = settings.cateringPackages || [];
  const approvedGallery = galleryPosts.filter(p => p.approved).sort((a, b) => b.likes - a.likes).slice(0, 6);

  return (
    <div className="max-w-3xl mx-auto space-y-8 print:space-y-4">
      {/* Header */}
      <div className="text-center border-b border-gray-800 pb-8">
        {settings.logoUrl && (
          <img src={settings.logoUrl} alt="Logo" className="w-20 h-20 mx-auto mb-4 object-contain" />
        )}
        <h1 className="text-3xl font-bold text-white">{settings.businessName || 'Our Business'}</h1>
        <p className="text-bbq-gold text-lg mt-1">{getLabel('tagline')}</p>
        <p className="text-gray-400 text-sm mt-3">Vendor Information Pack</p>
      </div>

      {/* Contact Details */}
      <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-bold text-white mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {settings.businessAddress && (
            <div className="flex items-center gap-2 text-gray-300"><MapPin size={14} className="text-bbq-red" /> {settings.businessAddress}</div>
          )}
          {settings.emailSettings?.fromEmail && (
            <div className="flex items-center gap-2 text-gray-300"><Mail size={14} className="text-bbq-red" /> {settings.emailSettings.fromEmail}</div>
          )}
          {settings.smsSettings?.fromNumber && (
            <div className="flex items-center gap-2 text-gray-300"><Phone size={14} className="text-bbq-red" /> {settings.smsSettings.fromNumber}</div>
          )}
        </div>
      </div>

      {/* Packages */}
      {packages.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">{getLabel('packages')}</h2>
          <div className="grid gap-4">
            {packages.map(pkg => (
              <div key={pkg.id} className="bg-gray-900/60 rounded-xl p-5 border border-gray-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-bold">{pkg.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{pkg.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Min {pkg.minPax} guests · Up to {pkg.meatLimit} proteins, {pkg.sideLimit} sides</p>
                  </div>
                  <p className="text-bbq-gold font-bold text-lg">${pkg.price}/head</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items */}
      {cateringItems.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">{getLabel('items')} Available</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {cateringItems.map(item => (
              <div key={item.id} className="bg-gray-900/60 rounded-lg p-3 border border-gray-800">
                <p className="text-white text-sm font-medium">{item.name}</p>
                <p className="text-bbq-gold text-xs">${item.price}{item.unit ? `/${item.unit}` : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Requirements */}
      {settings.contractSettings?.setupRequirements && (
        <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-bold text-white mb-3">Setup Requirements</h2>
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{settings.contractSettings.setupRequirements}</p>
        </div>
      )}

      {/* Service Timeline */}
      {settings.contractSettings?.serviceTimeline && (
        <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-bold text-white mb-3">Service Timeline</h2>
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{settings.contractSettings.serviceTimeline}</p>
        </div>
      )}

      {/* Gallery */}
      {approvedGallery.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">{getLabel('gallery')}</h2>
          <div className="grid grid-cols-3 gap-2">
            {approvedGallery.map(post => (
              <div key={post.id} className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                <img src={post.imageUrl} alt={post.caption} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 border-t border-gray-800 pt-6 print:pt-2">
        <p>Generated by {settings.businessName || 'Universal Business Platform'}</p>
        <p>For inquiries, contact us directly.</p>
      </div>
    </div>
  );
};

export default VendorPack;
