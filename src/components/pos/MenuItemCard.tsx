import { MenuItem } from '@/types/pos';
import { useOrderStore } from '@/store/orderStore';
import { cn } from '@/lib/utils';

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  // Check if item is in cart to show active state
  const { currentOrder } = useOrderStore();
  const quantityInCart = currentOrder.find(i => i.menuItem.id === item.id)?.quantity || 0;

  return (
    <div
      onClick={() => onAdd(item)}
      className={cn(
        "group relative flex flex-col justify-between p-4 rounded-xl cursor-pointer transition-all duration-300",
        "bg-card/50 hover:bg-card border border-border/50 hover:border-primary/50",
        "shadow-sm hover:shadow-lg hover:-translate-y-1 hover:z-50",
        "h-[180px] overflow-hidden"
      )}
    >
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Active Indicator */}
      {quantityInCart > 0 && (
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50 duration-200">
          {quantityInCart}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center gap-3 mt-2">
        <div className="text-4xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">
          {item.emoji}
        </div>

        <div className="space-y-1 w-full">
          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 min-h-[2.5em]">
            {item.name}
          </h3>
          <p className="text-primary font-bold text-lg">
            ₱{item.price.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Hover Action */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </div>
  );
}
