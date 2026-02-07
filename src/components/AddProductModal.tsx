import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Loader2 } from "lucide-react";
import CameraScanner from "./CameraScanner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: () => void;
}

const categories = [
  "Dairy",
  "Meat & Poultry",
  "Vegetables",
  "Fruits",
  "Beverages",
  "Snacks",
  "Canned Goods",
  "Frozen",
  "Bakery",
  "Condiments",
  "Medicine",
  "Personal Care",
  "Other",
];

const AddProductModal = ({ open, onOpenChange, onProductAdded }: AddProductModalProps) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Other");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannerType, setScannerType] = useState<"product_name" | "expiry_date" | null>(null);

  const resetForm = () => {
    setName("");
    setCategory("Other");
    setExpiryDate("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to add products");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    if (!expiryDate) {
      toast.error("Please enter an expiry date");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("products").insert({
        user_id: user.id,
        name: name.trim(),
        category,
        expiry_date: expiryDate,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      toast.success("Product added successfully!");
      resetForm();
      onProductAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanResult = (result: string) => {
    if (scannerType === "product_name") {
      setName(result);
    } else if (scannerType === "expiry_date") {
      setExpiryDate(result);
    }
    setScannerType(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Add a product to track its expiry date. Use the camera to scan labels automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Milk, Bread, Yogurt"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setScannerType("product_name")}
                  title="Scan product name"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <div className="flex gap-2">
                <Input
                  id="expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setScannerType("expiry_date")}
                  title="Scan expiry date"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Product"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {scannerType && (
        <CameraScanner
          scanType={scannerType}
          onResult={handleScanResult}
          onClose={() => setScannerType(null)}
        />
      )}
    </>
  );
};

export default AddProductModal;
