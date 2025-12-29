
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit } from "lucide-react";
import { useMenuStore } from '@/store/menuStore';
import { MenuItem } from '@/types/pos';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

export function MenuManagement() {
    const { items: menuItems, categories, addMenuItem, updateMenuItem, deleteMenuItem, addCategory, deleteCategory } = useMenuStore();
    const [newCategory, setNewCategory] = useState('');
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<MenuItem>>({ name: '', price: 0, category: 'Basic', emoji: '' });
    const [isEditing, setIsEditing] = useState(false);

    const handleAddCategory = () => {
        if (!newCategory.trim()) return;
        addCategory(newCategory.trim());
        setNewCategory('');
    };

    const handleSaveItem = async () => {
        if (!currentItem.name || !currentItem.price || !currentItem.category) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (isEditing && currentItem.id) {
            await updateMenuItem(currentItem.id, currentItem);
        } else {
            await addMenuItem(currentItem as Omit<MenuItem, 'id'>);
        }
        setIsItemDialogOpen(false);
        resetItemForm();
    };

    const openAddDialog = () => {
        resetItemForm();
        setIsEditing(false);
        setIsItemDialogOpen(true);
    };

    const openEditDialog = (item: MenuItem) => {
        setCurrentItem({ ...item });
        setIsEditing(true);
        setIsItemDialogOpen(true);
    };

    const resetItemForm = () => {
        // Safe default: use first category or 'Basic' fallback
        const defaultCategory = categories.length > 0 ? categories[0] : 'Basic';
        setCurrentItem({ name: '', price: 0, category: defaultCategory, emoji: '' });
    };

    return (
        <div className="grid gap-6 md:grid-cols-3">
            {/* Categories Column */}
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>Categories</CardTitle>
                    <CardDescription>Manage menu categories</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="New Category"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <Button size="icon" onClick={handleAddCategory} aria-label="Add Category">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {categories.map(cat => (
                            <div key={cat} className="flex items-center justify-between p-2 bg-secondary/50 rounded-md">
                                <span className="font-medium text-sm">{cat}</span>
                                {cat !== 'All' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => deleteCategory(cat)}
                                        aria-label={`Delete ${cat} category`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Items Column */}
            <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Menu Items</CardTitle>
                        <CardDescription>Add, edit, or remove items</CardDescription>
                    </div>
                    <Button onClick={openAddDialog}>
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {menuItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            <span className="mr-2">{item.emoji}</span>
                                            {item.name}
                                        </TableCell>
                                        <TableCell>{item.category}</TableCell>
                                        <TableCell className="text-right">₱{item.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} aria-label={`Edit ${item.name}`}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMenuItem(item.id)} aria-label={`Delete ${item.name}`}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {menuItems.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            No items found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Item Dialog */}
            <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? 'Update the details of the menu item.' : 'Create a new menu item for the POS.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={currentItem.name}
                                onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                                className="col-span-3"
                                placeholder="e.g. Iced Latte"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                                Price (₱)
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                value={currentItem.price}
                                onChange={(e) => setCurrentItem({ ...currentItem, price: parseFloat(e.target.value) || 0 })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                                Category
                            </Label>
                            <Select
                                value={currentItem.category}
                                onValueChange={(val) => setCurrentItem({ ...currentItem, category: val })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="emoji" className="text-right">
                                Emoji
                            </Label>
                            <Input
                                id="emoji"
                                value={currentItem.emoji || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, emoji: e.target.value })}
                                className="col-span-3"
                                placeholder="e.g. ☕"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveItem}>Save Changes</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
