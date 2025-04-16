export default function Footer() {
  return (
    <footer className="bg-gray-100 mt-10">
      <div className="container mx-auto px-4 py-6">
        <p className="text-center text-gray-600">
          &copy; {new Date().getFullYear()} 我的部落格 - 使用 Next.js, Tailwind CSS 和 Supabase 構建
        </p>
      </div>
    </footer>
  );
} 
 