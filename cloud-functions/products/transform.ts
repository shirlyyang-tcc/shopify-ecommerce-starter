import pick from "lodash-es/pick";
import groupBy from "lodash-es/groupBy";
import axios from 'axios';

// API endpoint
const MOCK_API = 'https://dummyjson.com/products';

// Product类型定义（注释形式）
// {
//   id: number;
//   title: string;
//   description: string;
//   price: number;
//   category: string;
//   brand: string;
//   stock: number;
// }

// TransformedProduct类型定义（注释形式）
// {
//   id: number;
//   name: string;
//   price: number;
//   category: string;
// }

export async function onRequest() {
  try {
    // 使用 axios 获取商品数据
    const response = await axios.get(MOCK_API);
    const products = response.data.products;

    // 使用 lodash 的 pick 函数选择需要的字段
    const transformedProducts = products.map(product => 
      pick({
        ...product,
        name: product.title  // 重命名 title 为 name
      }, ['id', 'name', 'price', 'category'])
    );

    // 使用 lodash 的 groupBy 函数按类别分组
    const groupedProducts = groupBy(transformedProducts, 'category');

    return new Response(JSON.stringify({
      success: true,
      data: {
        products: transformedProducts,
        groupedProducts
      }
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 