'use client';

import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { useState } from 'react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from './ui/input';
import { Button } from './ui/button';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from "./ui/use-toast";
import { login } from "../actions/login";

const FormSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must have more than 8 characters'),
  code: z.optional(z.string()),
});

const SignInForm = () => {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [showTwoFactor, setShowTwoFactor] = useState(false);

  const onSubmit = async (values) => {
    login(values).then((data) => {
      if (data?.twoFactor) {
        setShowTwoFactor(true);
      }
    });

    const signInData = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (!signInData?.error)
    {
      router.refresh();
      router.push('/rasa');
    }
    else if(signInData?.error == 'CredentialsSignin'){
      toast({
        title: 'Error',
        description: 'Incorrect credentials',
        variant: 'destructive'
      });
    } else if (signInData.error == "AccessDenied"){
      console.log(signInData.error);
    }
    else { console.log(signInData.error) }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-navy">
      <div className="max-w-md px-4 py-8 bg-white rounded-lg shadow-lg">
        <Form {...form} className="px-8 py-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>
            <div className='space-y-2'>
              {showTwoFactor && (
                  <FormField
                  control={form.control}
                  name='code'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: '#000' }}>Two Factor Code</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-white" 
                          style={{ color: '#000' }}
                          placeholder='123456'
                          {...field}
                        />
                      </FormControl>
                      {/* Apply inline CSS to make the error messages red */}
                      <FormMessage style={{ color: 'red' }} />
                    </FormItem>
                  )}
                />
              )}
              {!showTwoFactor && (
                <>
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
                            placeholder='mail@example.com'
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
              </>
              )}
            </div>
            <Button className='w-full mt-6 bg-orange-500 hover:bg-orange-500' type='submit'>
              {showTwoFactor ? "Confirm" : "Sign in"}
            </Button>
          </form>
        </Form>
        <p className='text-center text-sm mt-2' style={{ color: 'black' }}>
          If you don&apos;t have an account, please&nbsp;
          <Link className='text-blue-500 hover:underline' href='/login/sign-up'>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );  
};

export default SignInForm;

