import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address").min(5, "Email is too short").max(100, "Email is too long"),
});

type FormValues = z.infer<typeof formSchema>;

interface LoginDialogProps {
  onClose: () => void;
  onSubmit?: (email: string, name: string) => Promise<void>;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({ onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });
  
  // This is a direct submit handler that bypasses the form validation if needed
  const handleDirectSubmit = () => {
    const values = form.getValues();
    console.log("Direct submit with values:", values);
    
    if (values.email && values.name && onSubmit) {
      toast({
        title: "Direct Login",
        description: "Attempting direct login...",
      });
      
      setIsSubmitting(true);
      onSubmit(values.email, values.name)
        .then(() => {
          console.log("Direct login successful");
          toast({
            title: "Success",
            description: "Login successful!",
          });
        })
        .catch(error => {
          console.error("Direct login failed:", error);
          toast({
            title: "Login Failed",
            description: "Could not log in with the provided information.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    } else {
      toast({
        title: "Missing Information",
        description: "Please enter both email and name.",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmit = async (values: FormValues) => {
    if (!onSubmit) {
      console.error("No onSubmit handler provided to LoginDialog");
      toast({
        title: "Configuration Error",
        description: "The login form is not properly configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Processing",
      description: "Logging in...",
    });
    
    setIsSubmitting(true);
    try {
      console.log("Submitting login with:", values);
      await onSubmit(values.email, values.name);
      // Add a success state indication
      console.log("Login successful");
      toast({
        title: "Success",
        description: "Login successful!",
      });
    } catch (error) {
      console.error("Login failed:", error);
      // Set specific field errors for better visibility
      if (error instanceof Error) {
        console.log("Error details:", error.message);
      }
      
      // Set more visible field errors
      form.setError("email", { 
        message: "There was a problem with your login. Please try again."
      });
      
      // Also set root error for general visibility
      form.setError("root", { 
        message: "Login failed. Please make sure both email and name are provided."
      });
      
      toast({
        title: "Login Failed",
        description: "Could not log in with the provided information.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <DialogContent className="bg-[#f5f5dc] rounded-lg p-8 max-w-md w-full mx-4 shadow-lg">
      <DialogHeader>
        <div className="flex justify-between items-center mb-2">
          <DialogTitle className="font-tufte text-xl text-foreground">Log In / Register</DialogTitle>
        </div>
        <DialogDescription className="text-muted-foreground">
          Enter your name and email to log in or create a new account. No password needed!
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-muted-foreground mb-2">Full Name</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    {...field}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-200"
                    required
                    disabled={isSubmitting}
                    placeholder="Enter your full name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-muted-foreground mb-2">Email Address</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    {...field}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-200"
                    required
                    disabled={isSubmitting}
                    placeholder="your.email@example.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Display form-level errors */}
          {form.formState.errors.root && (
            <div className="text-red-700 text-sm border border-red-300 bg-[#f5f5dc] p-3 rounded-md shadow-sm">
              {form.formState.errors.root.message}
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <Button 
              type="submit" 
              className="w-full bg-accent text-background py-3 rounded-lg hover:bg-accent/90 transition duration-200 font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Continue'}
            </Button>
            
            <Button 
              type="button"
              onClick={handleDirectSubmit}
              className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition duration-200 font-medium"
              disabled={isSubmitting}
            >
              Try Direct Login
            </Button>
          </div>
        </form>
      </Form>
      
      <div className="text-muted-foreground text-xs mt-6">
        By continuing, you agree to our terms and conditions and privacy policy.
      </div>
    </DialogContent>
  );
};
