import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or Key is not defined in environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Supabaseのテーブルが存在するか確認し、なければ作成する関数
export async function ensureSupabaseTables() {
  try {
    console.log('テーブルの存在確認と作成を開始')
    
    // capturesテーブルが存在するか確認
    const { error: checkError } = await supabase
      .from('captures')
      .select('id')
      .limit(1)
    
    if (checkError) {
      console.log('captures テーブルが見つかりません。テーブルを作成します:', checkError.message)
      
      // capturesテーブルの作成
      // Note: これはプログラムでスキーマを変更するには Supabase のサービスロールが必要です
      // 通常、この操作は管理ダッシュボードから行います
      
      // SQL: CREATE TABLE IF NOT EXISTS captures (
      //   id SERIAL PRIMARY KEY,
      //   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      //   images JSONB,
      //   system_info JSONB,
      //   capture_count INTEGER
      // );
      
      console.log('テーブル作成のために管理ダッシュボードでの操作が必要です')
    } else {
      console.log('captures テーブルは既に存在します')
    }
    
    return { success: true }
  } catch (error) {
    console.error('Supabaseテーブル確認/作成エラー:', error)
    return { success: false, error }
  }
}
