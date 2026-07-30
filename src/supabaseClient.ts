import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function uploadImage(file: File) {
  // إنشاء اسم فريد للملف منعاً للتكرار
  const fileName = `${Date.now()}_${file.name}`;

  // 1. رفع الملف إلى مجلد Storage المسمى 'reports'
  const { data, error } = await supabase.storage
    .from('reports')
    .upload(fileName, file);

  if (error) {
    console.error('خطأ في رفع الصورة:', error.message);
    return null;
  }

  // 2. الحصول على الرابط العام المباشر للصورة
  const { data: publicUrlData } = supabase.storage
    .from('reports')
    .getPublicUrl(fileName);

  // هذا هو الرابط العام الذي يجب حفظه في قاعدة البيانات
  return publicUrlData.publicUrl; 
}