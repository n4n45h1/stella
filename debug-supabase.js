// デバッグ用スクリプト
// node debug-supabase.js コマンドで実行すると、Supabaseの接続をテストします

const { createClient } = require('@supabase/supabase-js');

// .env ファイルを読み込む
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL または Key が環境変数に定義されていません。');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('環境変数が設定されています。');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseConnection() {
  try {
    console.log('Supabase接続をテスト中...');
    
    // 単純なクエリを実行してみる
    const { data, error } = await supabase
      .from('captures')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('テーブルが存在しません。テーブルの作成が必要です。');
        
        console.log('テーブル作成のためのSQL:');
        console.log(`
CREATE TABLE public.captures (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  images JSONB,
  system_info JSONB,
  capture_count INTEGER
);
        `);
      } else {
        console.error('Supabase接続エラー:', error);
      }
    } else {
      console.log('Supabase接続成功!');
      console.log('取得したデータ:', data);
    }
  } catch (error) {
    console.error('予期せぬエラー:', error);
  }
}

checkSupabaseConnection();
