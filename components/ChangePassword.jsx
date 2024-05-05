'use client';

import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '/components/ui/form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '/components/ui/input';
import { Button } from '/components/ui/button';
import Link from 'next/link';
import { useToast } from "/components/ui/use-toast";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { changePass } from '../app/api/password-change/route';

const FormSchema = z.object({
  oldPassword: z.string().min(8, 'Password must have more than 8 characters'),
  newPassword: z.string().min(8, 'Password must have more than 8 characters'),
  confirmPassword: z.string().min(8, 'Password must have more than 8 characters'),
});

const ChangePassword = () => {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values) => {
    const { oldPassword, newPassword, confirmPassword } = values;

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New password and confirm password do not match',
        variant: 'destructive'
      });
      return;
    }

    const session = await getSession();

    if (!session) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive'
      });
      return;
    }

    const signInData = await signIn('credentials', {
      email: session.user.email,
      password: oldPassword,
      redirect: false,
    });
    
    if (signInData?.error) {
      toast({
        title: 'Error',
        description: 'Incorrect old password',
        variant: 'destructive'
      });
    } else {
      changePass(values);
      toast({
        title: 'Success',
        description: 'Password changed successfully',
        variant: 'success'
      });
      router.push('/login/sign-in');
    }

  };

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="h-screen flex justify-center items-center bg-navy">
      <div className="max-w-xl w-full px-4 py-8 bg-white rounded-lg shadow-lg">
        <Form {...form} className="px-8 py-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>
            <div className='space-y-4'>
              <FormField
                control={form.control}
                name='oldPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: '#000' }}>Old Password</FormLabel>
                    <FormControl>
                      <Input 
                        className="bg-white" 
                        style={{ color: '#000' }}
                        type='password'
                        placeholder='Enter your old password'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage style={{ color: 'red' }} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='newPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: '#000' }}>New Password</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-white" 
                        style={{ color: '#000' }}
                        type='password'
                        placeholder='Enter your new password'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage style={{ color: 'red' }} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: '#000' }}>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-white" 
                        style={{ color: '#000' }}
                        type='password'
                        placeholder='Re-Enter your new password'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage style={{ color: 'red' }} />
                  </FormItem>
                )}
              />
            </div>
            {form.formState.errors.error && (
              <p style={{ color: 'red' }}>{form.formState.errors.error.message}</p>
            )}
            <Button className='w-full mt-6 bg-orange-500 hover:bg-orange-500' type='submit'>
              Change Password
            </Button>
          </form>
        </Form>
        <p className='text-center text-sm mt-2' style={{ color: 'black' }}>
          <Link className='text-blue-500 hover:underline' href='/profile'>
            Back to Profile
          </Link>
        </p>
      </div>
    </div>
  );
};


export default ChangePassword;

