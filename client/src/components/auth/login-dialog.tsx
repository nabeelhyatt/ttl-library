import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

interface LoginDialogProps {
  onClose: () => void;
  onSubmit?: (email: string) => Promise<void>;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({ onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });
  
  const handleSubmit = async (values: FormValues) => {
    if (!onSubmit) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(values.email);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <DialogContent className="bg-secondary rounded-lg p-8 max-w-md w-full mx-4">
      <DialogHeader>
        <div className="flex justify-between items-center mb-2">
          <DialogTitle className="font-tufte text-xl text-foreground">Log In / Register</DialogTitle>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground transition"
          >
            <FontAwesomeIcon icon="times" />
          </button>
        </div>
        <DialogDescription className="text-muted-foreground">
          Use your email to log in or create a new account. No password needed!
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
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
                    className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-200"
                    required
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-accent text-background py-3 rounded-lg hover:bg-accent/90 transition duration-200 font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Continue'}
          </Button>
        </form>
      </Form>
      
      <div className="text-muted-foreground text-xs mt-6">
        By continuing, you agree to our terms and conditions and privacy policy.
      </div>
    </DialogContent>
  );
};
