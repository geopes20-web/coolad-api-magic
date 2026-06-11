// Paymob Payment Testing Utility
// استخدم هذا الملف لاختبار المشاكل

export async function testPaymobConfig(supabase: any, userToken: string) {
  console.log("🧪 Testing Paymob Configuration...\n");

  try {
    // Test 1: Check if function is accessible
    console.log("1️⃣ Testing Edge Function accessibility...");
    const testRes = await supabase.functions.invoke("paymob-initiate", {
      body: {
        idea_id: "test",
        amount_usd: 1,
      },
    });
    
    console.log("Response:", testRes);
    
    if (testRes.error) {
      console.error("❌ Function Error:", testRes.error);
      return { success: false, error: testRes.error };
    }
    
    if (testRes.data?.error) {
      console.error("❌ Paymob Error:", testRes.data.error);
      return { success: false, error: testRes.data.error };
    }
    
    console.log("✅ Function Response:", testRes.data);
    return { success: true, data: testRes.data };
    
  } catch (e) {
    console.error("❌ Test Error:", e);
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// استخدمه هكذا في أي component:
// const result = await testPaymobConfig(supabase, userToken);
// console.log(result);
