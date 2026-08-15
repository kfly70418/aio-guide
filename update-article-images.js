const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateArticleImages() {
  // 读取当前文章内容
  const { data: article, error: fetchError } = await supabase
    .from('articles')
    .select('content')
    .eq('slug', 'understand-agent-skills-mcp-concepts')
    .single();

  if (fetchError) {
    console.error('Error fetching article:', fetchError);
    return;
  }

  // 替换图片路径
  let updatedContent = article.content;
  for (let i = 1; i <= 9; i++) {
    const oldPath = `images/image-${i.toString().padStart(2, '0')}`;
    const newPath = `/images/articles/agent-concepts/image-${i.toString().padStart(2, '0')}`;
    updatedContent = updatedContent.replace(new RegExp(oldPath, 'g'), newPath);
  }

  // 更新数据库
  const { error: updateError } = await supabase
    .from('articles')
    .update({ content: updatedContent })
    .eq('slug', 'understand-agent-skills-mcp-concepts');

  if (updateError) {
    console.error('Error updating article:', updateError);
  } else {
    console.log('Article images updated successfully!');
    console.log('Updated paths: /images/articles/agent-concepts/image-01.png ~ image-09.png');
  }
}

updateArticleImages();
