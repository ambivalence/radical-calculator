// Test the problematic expression parsing
console.log("🐛 Testing Expression: 8/(3+6)");

// This is the problematic regex from the original code
const problematicTokens = "8/(3+6)".split(/(\+|\-|\*|\/|\^|\(|\)|sqrt\(|abs\(|sin\(|cos\(|tan\(|log\(|ln\(|\d+\/\d+)/);
console.log("❌ Problematic tokens:", problematicTokens.filter(t => t.trim()));

// Better approach - don't try to parse fractions in the tokenizer
const betterTokens = "8/(3+6)".split(/(\+|\-|\*|\/|\^|\(|\)|sqrt\(|abs\(|sin\(|cos\(|tan\(|log\(|ln\()/);
console.log("✅ Better tokens:", betterTokens.filter(t => t.trim()));

// Test other expressions
const testCases = [
  "8/(3+6)",
  "3/4", 
  "1/2 + 1/4",
  "sqrt(8)/2"
];

console.log("\n🧪 Testing all cases with better parsing:");
testCases.forEach(expr => {
  const tokens = expr.split(/(\+|\-|\*|\/|\^|\(|\)|sqrt\(|abs\(|sin\(|cos\(|tan\(|log\(|ln\()/);
  console.log(`"${expr}" →`, tokens.filter(t => t.trim()));
});
