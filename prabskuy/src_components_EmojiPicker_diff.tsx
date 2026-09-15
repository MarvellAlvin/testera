--- src/components/EmojiPicker.tsx (原始)


+++ src/components/EmojiPicker.tsx (修改后)
// Emoji Picker - Grid of emojis organized by category
import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  currentEmoji?: string;
}

// Emojis organized by category
const EMOJI_CATEGORIES = [
  {
    name: 'Keuangan',
    emojis: ['💰', '💵', '💴', '💶', '💷', '💸', '💳', '🧾', '🏦', '🪙', '💎', '📈', '📉', '📊', '💹', '🏧', '🤑', '👛', '👜', '💼'],
  },
  {
    name: 'Makanan',
    emojis: ['🍔', '🍕', '🍜', '🍱', '🍣', '🍙', '🍛', '🍝', '🌮', '🌯', '🥗', '🥘', '🍲', '🍳', '🥐', '🍞', '🥖', '🧀', '🥩', '🍗'],
  },
  {
    name: 'Minuman',
    emojis: ['☕', '🍵', '🧋', '🥤', '🧃', '🥛', '🍺', '🍻', '🥂', '🍷', '🍸', '🍹', '🍾', '💧', '🥤', '🧊'],
  },
  {
    name: 'Transportasi',
    emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🚲', '🛴', '🚆', '🚇'],
  },
  {
    name: 'Belanja',
    emojis: ['🛍️', '🛒', '🎁', '🎀', '👕', '👖', '👗', '👘', '👙', '👚', '👞', '👟', '👠', '👢', '🧢', '👒', '🎩', '👓', '🕶️', '🧳'],
  },
  {
    name: 'Rumah',
    emojis: ['🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛋️'],
  },
  {
    name: 'Hiburan',
    emojis: ['🎬', '🎭', '🎨', '🎪', '🎫', '🎟️', '🎮', '🕹️', '🎲', '🎯', '🎳', '🎸', '🎹', '🎺', '🎻', '🥁', '🎤', '🎧', '📺', '📻'],
  },
  {
    name: 'Kesehatan',
    emojis: ['💊', '💉', '🩺', '🩹', '🧬', '🦠', '🏥', '🚑', '🧘', '🏃', '🏋️', '🚴', '🏊', '🧗', '🤸', '⛹️', '🤾', '🏌️', '🏇', '🧖'],
  },
  {
    name: 'Pendidikan',
    emojis: ['📚', '📖', '📝', '✏️', '🖊️', '🖋️', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '🎓', '🏫', '👨‍🏫', '👩‍🏫', '🔬', '🔭', '🧮'],
  },
  {
    name: 'Teknologi',
    emojis: ['📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '📲', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💾', '💿', '📀', '🎥', '📷', '📹', '📼'],
  },
  {
    name: 'Travel',
    emojis: ['✈️', '🛫', '🛬', '🚀', '🛸', '🚁', '⛵', '🚤', '🛥️', '🛳️', '🗺️', '🧭', '🏖️', '🏝️', '🏔️', '⛰️', '🌋', '🏕️', '🎒', '🧳'],
  },
  {
    name: 'Investasi',
    emojis: ['📈', '📉', '💹', '🏦', '💰', '💎', '🥇', '🪙', '₿', '🇮🇩', '🇺🇸', '🏠', '📊', '💼', '📜', '🏛️', '🎯', '🔮', '⚡', '🌱'],
  },
  {
    name: 'Lainnya',
    emojis: ['⭐', '🌟', '✨', '💫', '🔥', '💥', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '👑', '💍', '⏰', '📅'],
  },
];

export function EmojiPicker({ onSelect, onClose, currentEmoji }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmojis = useMemo(() => {
    if (!searchQuery) return EMOJI_CATEGORIES[activeCategory].emojis;
    // Search across all categories
    const allEmojis = EMOJI_CATEGORIES.flatMap(c => c.emojis);
    return allEmojis; // Simple: just return all when searching
  }, [activeCategory, searchQuery]);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-[#1C1C1E] w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[70vh] flex flex-col border-t sm:border border-[#2C2C2E]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2C2C2E]">
          <h3 className="text-base font-bold text-[#F5F5F5]">Pilih Emoji</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#262626]">
            <X size={18} className="text-[#9CA3AF]" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari emoji..."
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#262626] border border-[#2C2C2E] text-sm text-[#F5F5F5] placeholder:text-[#9CA3AF] focus:outline-none"
            />
          </div>
        </div>

        {/* Category tabs */}
        {!searchQuery && (
          <div className="flex overflow-x-auto px-2 py-1 gap-1 border-b border-[#2C2C2E]">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(i)}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  activeCategory === i ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'text-[#9CA3AF]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Emoji grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((emoji, i) => (
              <button
                key={`${emoji}-${i}`}
                onClick={() => { onSelect(emoji); onClose(); }}
                className={`aspect-square flex items-center justify-center text-2xl rounded-lg transition-all active:scale-90 ${
                  currentEmoji === emoji ? 'bg-[#22C55E]/20 ring-2 ring-[#22C55E]/50' : 'hover:bg-[#262626]'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Current selection */}
        {currentEmoji && (
          <div className="p-3 border-t border-[#2C2C2E] flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF]">Dipilih:</span>
            <span className="text-2xl">{currentEmoji}</span>
          </div>
        )}
      </div>
    </div>
  );
}
