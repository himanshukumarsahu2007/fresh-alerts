import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, LogOut, Loader2, Package, Leaf } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import AddProductModal from "@/components/AddProductModal";
import { toast } from "sonner";
import { differenceInDays, isPast, isToday } from "date-fns";

interface Product {
  id: string;
  name: string;
  category: string;
  expiry_date: string;
  notes: string | null;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const fetchProducts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order("expiry_date", { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getProductStatus = (expiryDate: string) => {
    const date = new Date(expiryDate);
    const daysUntilExpiry = differenceInDays(date, new Date());
    if (isPast(date) && !isToday(date)) return "expired";
    if (isToday(date) || (daysUntilExpiry <= 3 && daysUntilExpiry > 0)) return "expiring";
    return "fresh";
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const status = getProductStatus(product.expiry_date);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(products.map((p) => p.category))];

  const stats = {
    total: products.length,
    expired: products.filter((p) => getProductStatus(p.expiry_date) === "expired").length,
    expiring: products.filter((p) => getProductStatus(p.expiry_date) === "expiring").length,
    fresh: products.filter((p) => getProductStatus(p.expiry_date) === "fresh").length,
  };

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">FreshTrack</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Items</p>
            <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-4">
            <p className="text-sm text-muted-foreground">Expired</p>
            <p className="text-2xl font-bold text-destructive">{stats.expired}</p>
          </div>
          <div className="rounded-xl border border-border bg-secondary p-4">
            <p className="text-sm text-muted-foreground">Expiring Soon</p>
            <p className="text-2xl font-bold text-secondary-foreground">{stats.expiring}</p>
          </div>
          <div className="rounded-xl border border-primary/50 bg-accent p-4">
            <p className="text-sm text-muted-foreground">Fresh</p>
            <p className="text-2xl font-bold text-primary">{stats.fresh}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="expired">Expired ({stats.expired})</TabsTrigger>
            <TabsTrigger value="expiring">Expiring ({stats.expiring})</TabsTrigger>
            <TabsTrigger value="fresh">Fresh ({stats.fresh})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">No products found</h3>
            <p className="mb-4 text-muted-foreground">
              {products.length === 0
                ? "Start tracking your products by adding your first item."
                : "Try adjusting your search or filters."}
            </p>
            {products.length === 0 && (
              <Button onClick={() => setAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Product
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      <AddProductModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onProductAdded={fetchProducts}
      />
    </div>
  );
};

export default Dashboard;
