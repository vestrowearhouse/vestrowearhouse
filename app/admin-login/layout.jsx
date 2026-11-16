import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Admin Login - Vestro Wear House',
  description: 'Vestro Wear House Admin Login',
};

export default function AdminLoginLayout({ children }) {
  const cookieStore = cookies();
  const adminToken = cookieStore.get('adminToken');
  
  if (adminToken) {
    redirect('/admin/dashboard');
  }
  
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

