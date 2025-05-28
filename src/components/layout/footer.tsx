import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">水晶商城</h3>
            <p className="text-gray-400 text-sm">
              提供高品质水晶，满足您的好运需求，让每一步都充满活力。
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  首页
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  全部产品
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">联系方式</h3>
            <address className="text-gray-400 not-italic">
              <p>地址：北京市朝阳区三里屯</p>
              <p>电话：010-12345678</p>
              <p>邮箱：contact@sportshoes.com</p>
            </address>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} 水晶商城. 保留所有权利.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 