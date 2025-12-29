import { create } from 'zustand';
import { io } from 'socket.io-client';
import { MenuItem, Category } from '@/types/pos';
import { toast } from 'sonner';

interface MenuState {
    items: MenuItem[];
    categories: Category[];
    isLoading: boolean;
    fetchMenu: () => Promise<void>;
    addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
    updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
    deleteMenuItem: (id: string) => Promise<void>;
    addCategory: (category: string) => Promise<void>;
    deleteCategory: (category: string) => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || '';

export const useMenuStore = create<MenuState>((set, get) => ({
    items: [],
    categories: ['All'],
    isLoading: false,

    fetchMenu: async () => {
        set({ isLoading: true });
        try {
            const res = await fetch(`${API_URL}/api/menu`);
            if (res.ok) {
                const data = await res.json();
                set({ items: data.items, categories: data.categories });
            }
        } catch (error) {
            console.error('Failed to fetch menu:', error);
            toast.error('Failed to load menu');
        } finally {
            set({ isLoading: false });
        }
    },

    addMenuItem: async (item) => {
        try {
            const res = await fetch(`${API_URL}/api/menu/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
            });
            if (res.ok) {
                const newItem = await res.json();
                set((state) => ({ items: [...state.items, newItem] }));
                toast.success('Item added successfully');
            } else {
                throw new Error('Failed to add item');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to add item');
        }
    },

    updateMenuItem: async (id, updates) => {
        try {
            const res = await fetch(`${API_URL}/api/menu/items/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                const updatedItem = await res.json();
                set((state) => ({
                    items: state.items.map((i) => (i.id === id ? updatedItem : i)),
                }));
                toast.success('Item updated');
            } else {
                throw new Error('Failed to update item');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update item');
        }
    },

    deleteMenuItem: async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            const res = await fetch(`${API_URL}/api/menu/items/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                set((state) => ({
                    items: state.items.filter((i) => i.id !== id),
                }));
                toast.success('Item deleted');
            } else {
                throw new Error('Failed to delete item');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete item');
        }
    },

    addCategory: async (category) => {
        try {
            const res = await fetch(`${API_URL}/api/menu/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category }),
            });
            if (res.ok) {
                const categories = await res.json();
                set({ categories });
                toast.success('Category added');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to add category');
        }
    },

    deleteCategory: async (category) => {
        if (!confirm(`Delete category "${category}"?`)) return;
        try {
            const res = await fetch(`${API_URL}/api/menu/categories/${encodeURIComponent(category)}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                const categories = await res.json();
                set({ categories });
                toast.success('Category deleted');
            } else {
                const err = await res.json();
                toast.error(err.error || 'Failed to delete');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete category');
        }
    }
}));

// Socket listening for menu changes
const socket = io(API_URL);

socket.on('connect', () => {
    // console.log('MenuStore connected to socket');
});

socket.on('menu:update', () => {
    // console.log('Menu update received, refetching...');
    useMenuStore.getState().fetchMenu();
});
