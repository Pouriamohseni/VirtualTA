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
import { useRouter } from 'next/navigation';
import { useToast } from "/components/ui/use-toast";

const FormSchema = z
  .object({
    username: z.string().min(1, 'Username is required').max(100),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must have more than 8 characters'),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Password does not match',
  });

const SignUpForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values) => {
    const response = await fetch('/api/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: values.username,
        email: values.email,
        password: values.password
      })
    })

    if (response.ok) {
      router.push('/login/sign-in')
    } else {
      toast({
        title: 'Error',
        description: 'Username or Email Already Exists',
        status: 'error',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-navy">
      <div className="max-w-md px-4 py-8 bg-white rounded-lg shadow-lg">
        <Form {...form} className="px-8 py-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>
            <div className='space-y-2'>
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: '#000' }}>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder='johndoe' {...field}
                        className="bg-white" 
                        style={{ color: '#000' }} 
                      />
                    </FormControl>
                    {/* Apply inline CSS to make the error messages red */}
                    <FormMessage style={{ color: 'red' }} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: '#000' }}>Email</FormLabel>
                    <FormControl>
                      <Input 
                        className="bg-white" 
                        style={{ color: '#000' }}
                        placeholder='mail@example.com' {...field} 
                      />
                    </FormControl>
                    {/* Apply inline CSS to make the error messages red */}
                    <FormMessage style={{ color: 'red' }} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: '#000' }}>Password</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-white" 
                        style={{ color: '#000' }}
                        type='password'
                        placeholder='Enter your password'
                        {...field}
                      />
                    </FormControl>
                    {/* Apply inline CSS to make the error messages red */}
                    <FormMessage style={{ color: 'red' }} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: '#000' }}>Re-Enter your password</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-white" 
                        style={{ color: '#000' }}
                        placeholder='Re-Enter your password'
                        type='password'
                        {...field}
                      />
                    </FormControl>
                    {/* Apply inline CSS to make the error messages red */}
                    <FormMessage style={{ color: 'red' }} />
                  </FormItem>
                )}
              />
            </div>
            <Button className='w-full mt-6 bg-orange-500 hover:bg-orange-500' type='submit'>
              Sign up
            </Button>
          </form>
        </Form>
        <p className='text-center text-sm mt-2' style={{ color: 'black' }}>
          If you already have an account, please&nbsp;
          <Link className='text-blue-500 hover:underline' href='/login/sign-in'>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
  
};

export default SignUpForm;
