import { useToast as useNewToast } from "@keystone/primitives/default/ui/use-toast";

export const useToasts = () => {
  const { toast } = useNewToast();

  const addToast = ({ title, tone, message }) => {
    // Map the tone to the new API's status if needed
    const status = tone === "negative" ? "error" : "success";

    // Call the new toast function with the adapted arguments
    toast({
      title: title,
      description: message,
      status: status,
      // Include any other necessary properties for the new toast
    });
  };

  // If you have other functions in the old API, add them here

  return {
    addToast,
    // Include any other returned functions from the old useToasts
  };
};
