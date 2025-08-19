"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import { createApiKey } from "../actions/getApiKeys";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Client-side token generation
function generateApiKeyToken(): string {
  // Generate a secure API key token in the browser
  const prefix = 'osp_';
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  
  // Convert to base62 (alphanumeric) for readability
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < randomBytes.length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  
  return prefix + result;
}

// Define API key scopes as options for MultipleSelector
const scopeOptions: Option[] = [
  { value: "read_orders", label: "read_orders" },
  { value: "write_orders", label: "write_orders" },
  { value: "read_products", label: "read_products" },
  { value: "write_products", label: "write_products" },
  { value: "read_shops", label: "read_shops" },
  { value: "write_shops", label: "write_shops" },
  { value: "read_channels", label: "read_channels" },
  { value: "write_channels", label: "write_channels" },
  { value: "read_matches", label: "read_matches" },
  { value: "write_matches", label: "write_matches" },
  { value: "read_links", label: "read_links" },
  { value: "write_links", label: "write_links" },
  { value: "read_platforms", label: "read_platforms" },
  { value: "write_platforms", label: "write_platforms" },
  { value: "read_webhooks", label: "read_webhooks" },
  { value: "write_webhooks", label: "write_webhooks" },
  { value: "read_analytics", label: "read_analytics" },
  { value: "read_users", label: "read_users" },
  { value: "write_users", label: "write_users" },
];

export function CreateApiKey() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [createdToken, setCreatedToken] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    scopes: [] as Option[],
    expiresAt: "",
  });

  const router = useRouter();

  const handleScopeChange = (scopes: Option[]) => {
    setFormData(prev => ({
      ...prev,
      scopes: scopes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Please enter a name for your API key");
      return;
    }

    if (formData.scopes.length === 0) {
      toast.error("Please select at least one scope");
      return;
    }

    setLoading(true);

    try {
      // Generate token client-side
      const generatedToken = generateApiKeyToken();
      
      const result = await createApiKey({
        name: formData.name,
        scopes: formData.scopes.map(scope => scope.value),
        expiresAt: formData.expiresAt || undefined,
        tokenSecret: generatedToken, // Pass the generated token to be hashed
      });

      if (result.success) {
        // Show the generated token (this is the only time it will be visible)
        setCreatedToken(generatedToken);
        setShowToken(true);
        toast.success("API key created successfully!");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create API key");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("Failed to create API key");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setShowToken(false);
    setCreatedToken("");
    setFormData({
      name: "",
      scopes: [] as Option[],
      expiresAt: "",
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(createdToken);
      toast.success("API key copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy API key");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="icon"
          className="lg:px-4 lg:py-2 lg:w-auto rounded-lg"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden lg:inline">Create API Key</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        {!showToken ? (
          <>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for programmatic access to Openship. Choose the minimum permissions needed.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Production Bot, Analytics Dashboard"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>
                    Scopes <span className="text-red-500">*</span>
                  </Label>
                  <MultipleSelector
                    commandProps={{
                      label: "Select API key scopes",
                    }}
                    value={formData.scopes}
                    defaultOptions={scopeOptions}
                    placeholder="Select scopes for this API key"
                    hideClearAllButton={false}
                    hidePlaceholderWhenSelected={true}
                    emptyIndicator={<p className="text-center text-sm">No scopes found</p>}
                    onChange={handleScopeChange}
                    className="text-base"
                  />
                  <p className="text-muted-foreground mt-2 text-xs">
                    Select the minimum permissions needed for this API key
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expiresAt">Expiration (optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create API Key"}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Your API key has been created. Copy it now - you won't be able to see it again.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <div className="bg-muted/50 border rounded-md">
                  <div className="p-1 flex items-center gap-3">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="bg-background shadow-xs border rounded-sm py-0.5 px-1 text-[.65rem] text-muted-foreground font-medium">
                          KEY
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-mono truncate">
                          {createdToken}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-sm h-6 w-6 flex-shrink-0"
                      onClick={copyToClipboard}
                    >
                      <Copy className="size-3" />
                      <span className="sr-only">Copy API Key</span>
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Make sure to copy your API key now. You won't be able to see it again!
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}