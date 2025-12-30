import { MenuItem } from '@/types/pos';
import { useOrderStore } from '@/store/orderStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem, flavors?: string[]) => void;
}

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);

  // Check if item is in cart to show active state
  const { currentOrder } = useOrderStore();
  const quantityInCart = currentOrder
    .filter(i => i.menuItem.id === item.id)
    .reduce((acc, curr) => acc + curr.quantity, 0);

  const handleClick = () => {
    if (item.flavors && item.flavors.length > 0) {
      setSelectedFlavors([]); // Reset on open
      setIsDialogOpen(true);
    } else {
      onAdd(item);
    }
  };

  const toggleFlavor = (flavor: string) => {
    setSelectedFlavors(prev => {
      const isSelected = prev.includes(flavor);
      if (isSelected) {
        return prev.filter(f => f !== flavor);
      } else {
        // Enforce maxFlavors
        const max = item.maxFlavors || 1;
        if (prev.length >= max) {
          // Optional: You could replace the last one, or just stop adding.
          // Let's stop adding for clarity, or maybe toast?
          // For now, simple implementation:
          return prev;
        }
        return [...prev, flavor];
      }
    });
  };

  const handleConfirm = () => {
    onAdd(item, selectedFlavors.length > 0 ? selectedFlavors : undefined);
    setIsDialogOpen(false);
  };

  const isSelected = (flavor: string) => selectedFlavors.includes(flavor);
  const max = item.maxFlavors || 1;

  return (
    <>
      <div
        onClick={handleClick}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Flavor</DialogTitle>
            <DialogDescription>
              Choose up to {max} flavor{max > 1 ? 's' : ''} for {item.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {item.flavors?.map((flavor) => (
              <Button
                key={flavor}
                variant={isSelected(flavor) ? "default" : "outline"}
                className={cn(
                  "h-16 text-lg transition-all",
                  isSelected(flavor) ? "border-primary" : "hover:border-primary hover:bg-primary/5"
                )}
                onClick={() => toggleFlavor(flavor)}
              >
                {flavor}
              </Button>
            ))}
          </div>
          <Button
            onClick={handleConfirm}
            className="w-full mt-2"
            size="lg"
          // Optional: disable if 0 selected?
          // disabled={selectedFlavors.length === 0}
          >
            Add to Order
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
