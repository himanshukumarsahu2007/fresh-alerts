import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Other");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Persist a draft between scans so values aren't omitted when navigating away
  useEffect(() => {
    if (!open) return;

    // 1) Restore draft (if any)
    const draftRaw = sessionStorage.getItem("addProductDraft");
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw) as {
          name?: string;
          category?: string;
          expiryDate?: string;
          notes?: string;
        };

        // Only fill empty fields to avoid overwriting what the user just typed
        if (!name && draft.name) setName(draft.name);
        if (category === "Other" && draft.category) setCategory(draft.category);
        if (!expiryDate && draft.expiryDate) setExpiryDate(draft.expiryDate);
        if (!notes && draft.notes) setNotes(draft.notes);
      } catch {
        // If draft is corrupt, ignore it
      }
    }

    // 2) Apply scanned results from URL params
    const scannedName = searchParams.get("scanned_product_name");
    const scannedExpiry = searchParams.get("scanned_expiry_date");

    if (scannedName) setName(scannedName);
    if (scannedExpiry) setExpiryDate(scannedExpiry);

    // 3) Clear URL params after reading them (single replace)
    if (scannedName || scannedExpiry) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("scanned_product_name");
      newParams.delete("scanned_expiry_date");
      setSearchParams(newParams, { replace: true });
    }
  }, [open, searchParams, setSearchParams, name, category, expiryDate, notes]);

  const resetForm = () => {
    setName("");
    setCategory("Other");
    setExpiryDate("");
    setNotes("");
    sessionStorage.removeItem("addProductDraft");
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
      sessionStorage.removeItem("addProductDraft");
      onProductAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScan = (type: "product_name" | "expiry_date") => {
    // Save current draft so navigating to /scan won't drop already-entered/scanned values
    sessionStorage.setItem(
      "addProductDraft",
      JSON.stringify({ name, category, expiryDate, notes })
    );

    onOpenChange(false);
    navigate(`/scan?type=${type}`);
  };

  return (
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
                onClick={() => handleScan("product_name")}
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
                onClick={() => handleScan("expiry_date")}
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
  );
};

export default AddProductModal;
