import { format, differenceInDays, isPast, isToday } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Clock, CheckCircle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  expiry_date: string;
  notes: string | null;
}

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
}

const ProductCard = ({ product, onDelete }: ProductCardProps) => {
  const expiryDate = new Date(product.expiry_date);
  const daysUntilExpiry = differenceInDays(expiryDate, new Date());
  const isExpired = isPast(expiryDate) && !isToday(expiryDate);
  const expirestoday = isToday(expiryDate);
  const expiresSoon = daysUntilExpiry <= 3 && daysUntilExpiry > 0;

  const getStatusInfo = () => {
    if (isExpired) {
      return {
        icon: AlertTriangle,
        label: "Expired",
        variant: "destructive" as const,
        className: "border-destructive/50 bg-destructive/5",
      };
    }
    if (expirestoday) {
      return {
        icon: AlertTriangle,
        label: "Expires Today",
        variant: "destructive" as const,
        className: "border-destructive/50 bg-destructive/5",
      };
    }
    if (expiresSoon) {
      return {
        icon: Clock,
        label: `${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"} left`,
        variant: "secondary" as const,
        className: "border-border bg-secondary",
      };
    }
    return {
      icon: CheckCircle,
      label: `${daysUntilExpiry} days left`,
      variant: "outline" as const,
      className: "",
    };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${status.className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-card-foreground">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground">{product.category}</p>
            {product.notes && (
              <p className="mt-1 truncate text-xs text-muted-foreground">{product.notes}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Expires:</span>
            <span className="font-medium">{format(expiryDate, "MMM d, yyyy")}</span>
          </div>
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
