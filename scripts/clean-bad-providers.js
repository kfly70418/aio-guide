const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanBadProviders() {
  // 删除名称异常的服务商
  const { data, error } = await supabase
    .from('providers')
    .delete()
    .or('name.like.*创建于*,name.like.*\n*,name.like.*D\n*,name.like.*C\n*,name.like.*M\n*');

  if (error) {
    console.error('删除失败:', error);
  } else {
    console.log('已清理异常数据');
  }
}

cleanBadProviders();
