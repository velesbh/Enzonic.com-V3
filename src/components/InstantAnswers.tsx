import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Clock, Languages, Calendar, Ruler } from "lucide-react";

// Instant Answers component for special search queries
interface InstantAnswerProps {
  query: string;
  language?: string;
}

export default function InstantAnswers({ query, language = "en" }: InstantAnswerProps) {
  const normalizedQuery = query.toLowerCase().trim();
  
  console.log('InstantAnswers - Query:', query, 'Normalized:', normalizedQuery);
  
  // Calculator detection
  const calculatorTriggers = ['calculator', 'calc', 'calculate'];
  const isCalculator = calculatorTriggers.some(trigger => normalizedQuery.includes(trigger)) ||
                       /^[\d\s\+\-\*\/\(\)\.\%]+$/.test(normalizedQuery);
  
  console.log('isCalculator:', isCalculator);
  
  // Time detection
  const timeTriggers = ['time', 'clock', 'what time is it', 'current time'];
  const isTime = timeTriggers.some(trigger => normalizedQuery.includes(trigger));
  
  // Date detection
  const dateTriggers = ['date', 'today', 'what day is it', 'current date', "today's date"];
  const isDate = dateTriggers.some(trigger => normalizedQuery.includes(trigger));
  
  // Translate detection
  const translateTriggers = ['translate', 'translation'];
  const isTranslate = translateTriggers.some(trigger => normalizedQuery.includes(trigger));
  
  // Unit conversion detection
  const unitTriggers = ['convert', 'km to miles', 'miles to km', 'celsius to fahrenheit', 'fahrenheit to celsius', 'kg to lbs', 'lbs to kg', 'm to cm', 'cm to m', 'feet to meters'];
  const isUnitConversion = unitTriggers.some(trigger => normalizedQuery.includes(trigger));
  
  // Currency conversion detection
  const currencyTriggers = ['usd to', 'eur to', 'gbp to', 'jpy to', 'cad to', 'aud to', 'chf to', 'inr to', 'currency', 'exchange rate'];
  const isCurrencyConversion = currencyTriggers.some(trigger => normalizedQuery.includes(trigger)) || 
                                /\b[A-Z]{3}\s+to\s+[A-Z]{3}\b/i.test(normalizedQuery);

  if (isCalculator) {
    return <CalculatorCard initialExpression={normalizedQuery} />;
  }
  
  if (isTime) {
    return <TimeCard />;
  }
  
  if (isDate) {
    return <DateCard />;
  }
  
  if (isTranslate) {
    return <TranslateCard query={query} />;
  }
  
  if (isCurrencyConversion) {
    return <CurrencyConverterCard query={query} />;
  }
  
  if (isUnitConversion) {
    return <UnitConverterCard query={query} />;
  }

  return null;
}

// Calculator Component - Compact Sidebar Version
function CalculatorCard({ initialExpression }: { initialExpression: string }) {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");

  useEffect(() => {
    // Try to evaluate initial expression if it's a math expression
    if (initialExpression && /^[\d\s\+\-\*\/\(\)\.\%]+$/.test(initialExpression)) {
      try {
        const result = eval(initialExpression);
        setDisplay(result.toString());
        setExpression(initialExpression);
      } catch {
        setDisplay("0");
      }
    }
  }, [initialExpression]);

  const handleClick = (value: string) => {
    if (value === "=") {
      try {
        const result = eval(expression);
        setDisplay(result.toString());
        setExpression(result.toString());
      } catch {
        setDisplay("Error");
        setExpression("");
      }
    } else if (value === "C") {
      setDisplay("0");
      setExpression("");
    } else if (value === "←") {
      const newExpr = expression.slice(0, -1);
      setExpression(newExpr);
      setDisplay(newExpr || "0");
    } else {
      const newExpr = expression === "0" ? value : expression + value;
      setExpression(newExpr);
      setDisplay(newExpr);
    }
  };

  const buttons = [
    ["7", "8", "9", "/"],
    ["4", "5", "6", "*"],
    ["1", "2", "3", "-"],
    ["0", ".", "=", "+"],
    ["C", "←", "(", ")"]
  ];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-primary/20">
            <div className="p-1.5 bg-primary/10 rounded-full">
              <Calculator className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Calculator</span>
          </div>

          {/* Display */}
          <div className="bg-background border rounded-lg p-3 text-right text-lg font-mono min-h-[50px] flex items-center justify-end">
            {display}
          </div>

          {/* Buttons - Compact */}
          <div className="grid gap-1.5">
            {buttons.map((row, i) => (
              <div key={i} className="grid grid-cols-4 gap-1.5">
                {row.map((btn) => (
                  <Button
                    key={btn}
                    variant={btn === "=" ? "default" : "outline"}
                    onClick={() => handleClick(btn)}
                    className="h-10 text-sm font-semibold"
                    size="sm"
                  >
                    {btn}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Time Component - Compact Sidebar Version
function TimeCard() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-blue-500/20">
            <div className="p-1.5 bg-blue-500/10 rounded-full">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Current Time</span>
          </div>

          {/* Time Display */}
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold font-mono">
              {time.toLocaleTimeString('en-US', { hour12: true })}
            </div>
            <div className="text-xs text-muted-foreground">
              {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="text-xs text-muted-foreground">
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Date Component - Compact Sidebar Version
function DateCard() {
  const today = new Date();

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-green-500/20">
            <div className="p-1.5 bg-green-500/10 rounded-full">
              <Calendar className="h-4 w-4 text-green-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Today's Date</span>
          </div>

          {/* Date Display */}
          <div className="text-center space-y-2">
            <div className="text-lg font-bold leading-tight">
              {today.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              Day {Math.ceil((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))} • Week {Math.ceil(((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)) / 7)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Translate Component
function TranslateCard({ query }: { query: string }) {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [fromLang, setFromLang] = useState("en");
  const [toLang, setToLang] = useState("es");
  const [loading, setLoading] = useState(false);

  // Extract text from query if it contains "translate [text]"
  useEffect(() => {
    const match = query.match(/translate\s+(.+)/i);
    if (match && match[1]) {
      setInputText(match[1]);
    }
  }, [query]);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    setLoading(true);
    try {
      // Use the same translation system as the main Translate page
      const { env } = await import("@/lib/env");
      
      const response = await fetch(env.OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "translate",
          messages: [{
            role: "system",
            content: "You are a professional translator. Translate text accurately while preserving meaning and tone. Only provide the translation without explanations."
          }, {
            role: "user",
            content: `Translate the following text from ${fromLang} to ${toLang}:\n\n${inputText}`
          }],
          max_tokens: 2000,
          temperature: 0.3
        })
      });
      
      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Try both chat completion and regular completion response formats
      const translation = data.choices?.[0]?.message?.content?.trim() ||
                         data.choices?.[0]?.text?.trim() ||
                         data.text?.trim() ||
                         "";
      
      if (!translation) {
        throw new Error("No translation received from API");
      }
      
      setOutputText(translation);
    } catch (error) {
      console.error("Translation error:", error);
      setOutputText("Translation error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" }
  ];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-purple-500/20">
            <div className="p-1.5 bg-purple-500/10 rounded-full">
              <Languages className="h-4 w-4 text-purple-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Translator</span>
          </div>

          {/* Language Selection */}
          <div className="flex gap-2 items-center text-xs">
            <Select value={fromLang} onValueChange={setFromLang}>
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">→</span>
            <Select value={toLang} onValueChange={setToLang}>
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Input and Button */}
          <div className="space-y-2">
            <Input
              placeholder="Text to translate..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
              className="text-sm h-8"
            />
            <Button 
              onClick={handleTranslate} 
              disabled={loading || !inputText.trim()}
              className="w-full h-8 text-xs"
              size="sm"
            >
              {loading ? "Translating..." : "Translate"}
            </Button>
          </div>
          
          {/* Output */}
          {outputText && (
            <div className="bg-background border rounded-lg p-2 min-h-[50px] text-sm">
              {outputText}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Unit Converter Component
function UnitConverterCard({ query }: { query: string }) {
  const [value, setValue] = useState("");
  const [fromUnit, setFromUnit] = useState("km");
  const [toUnit, setToUnit] = useState("miles");
  const [result, setResult] = useState("");
  const [category, setCategory] = useState("distance");

  const conversions: Record<string, Record<string, number>> = {
    distance: {
      km: 1,
      miles: 0.621371,
      meters: 1000,
      centimeters: 100000,
      millimeters: 1000000,
      feet: 3280.84,
      yards: 1093.61,
      inches: 39370.1
    },
    temperature: {
      celsius: 1,
      fahrenheit: (9/5) + 32,
      kelvin: 273.15
    },
    weight: {
      kg: 1,
      lbs: 2.20462,
      grams: 1000,
      milligrams: 1000000,
      ounces: 35.274,
      tons: 0.001
    },
    volume: {
      liters: 1,
      milliliters: 1000,
      gallons: 0.264172,
      cups: 4.22675,
      pints: 2.11338,
      quarts: 1.05669
    }
  };

  useEffect(() => {
    const numMatch = query.match(/(\d+\.?\d*)/);
    if (numMatch) {
      setValue(numMatch[1]);
    }
  }, [query]);

  useEffect(() => {
    if (value && !isNaN(parseFloat(value))) {
      const val = parseFloat(value);
      let convertedValue: number;

      if (category === "temperature") {
        // Special handling for temperature
        if (fromUnit === "celsius" && toUnit === "fahrenheit") {
          convertedValue = (val * 9/5) + 32;
        } else if (fromUnit === "fahrenheit" && toUnit === "celsius") {
          convertedValue = (val - 32) * 5/9;
        } else if (fromUnit === "celsius" && toUnit === "kelvin") {
          convertedValue = val + 273.15;
        } else if (fromUnit === "kelvin" && toUnit === "celsius") {
          convertedValue = val - 273.15;
        } else {
          convertedValue = val;
        }
      } else {
        const baseValue = val / conversions[category][fromUnit];
        convertedValue = baseValue * conversions[category][toUnit];
      }

      setResult(convertedValue.toFixed(4));
    } else {
      setResult("");
    }
  }, [value, fromUnit, toUnit, category]);

  const unitOptions: Record<string, string[]> = {
    distance: ["km", "miles", "meters", "centimeters", "millimeters", "feet", "yards", "inches"],
    temperature: ["celsius", "fahrenheit", "kelvin"],
    weight: ["kg", "lbs", "grams", "milligrams", "ounces", "tons"],
    volume: ["liters", "milliliters", "gallons", "cups", "pints", "quarts"]
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-orange-500/5 to-orange-500/10">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-orange-500/20">
            <div className="p-1.5 bg-orange-500/10 rounded-full">
              <Ruler className="h-4 w-4 text-orange-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Unit Converter</span>
          </div>

          <div className="space-y-4">
          <Select value={category} onValueChange={(val) => {
            setCategory(val);
            setFromUnit(unitOptions[val][0]);
            setToUnit(unitOptions[val][1]);
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">Distance</SelectItem>
              <SelectItem value="temperature">Temperature</SelectItem>
              <SelectItem value="weight">Weight</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Enter value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <Select value={fromUnit} onValueChange={setFromUnit}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {unitOptions[category].map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-muted-foreground">→</span>
            <Select value={toUnit} onValueChange={setToUnit}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {unitOptions[category].map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {result && (
            <div className="bg-background border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{result} {toUnit}</div>
            </div>
          )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Currency Converter Component
function CurrencyConverterCard({ query }: { query: string }) {
  const [amount, setAmount] = useState("1");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currencies, setCurrencies] = useState<Record<string, any>>({});
  const [lastUpdate, setLastUpdate] = useState("");

  const API_KEY = "fca_live_cWkrLtI2jG1G5sbz6iPkH4nKRZ19MphdlNdXfeqo";
  const CACHE_KEY = "enzonic_currency_cache";
  const CACHE_DURATION = 3600000; // 1 hour
  const API_BASE = "https://api.freecurrencyapi.com/v1";

  // Load currencies on mount
  useEffect(() => {
    loadCurrencies();
  }, []);

  // Extract amount and currencies from query
  useEffect(() => {
    const match = query.match(/(\d+\.?\d*)\s*([A-Z]{3})\s+to\s+([A-Z]{3})/i);
    if (match) {
      setAmount(match[1]);
      setFromCurrency(match[2].toUpperCase());
      setToCurrency(match[3].toUpperCase());
    }
  }, [query]);

  // Auto-convert when values change
  useEffect(() => {
    if (amount && fromCurrency && toCurrency && Object.keys(currencies).length > 0) {
      convertCurrency();
    }
  }, [amount, fromCurrency, toCurrency, currencies]);

  const loadCurrencies = async () => {
    try {
      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setCurrencies(data);
          setLastUpdate(new Date(timestamp).toLocaleString());
          return;
        }
      }

      // Fetch from API with proper headers
      const response = await fetch(
        `${API_BASE}/currencies?apikey=${API_KEY}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        console.error(`Currency API error: ${response.status} ${response.statusText}`);
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      const currencyData = result.data || {};
      
      // Cache the data
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: currencyData,
        timestamp: Date.now()
      }));

      setCurrencies(currencyData);
      setLastUpdate(new Date().toLocaleString());
    } catch (err) {
      console.error('Failed to load currencies:', err);
      // Use fallback currencies if API fails
      const fallback = {
        USD: { name: "US Dollar", code: "USD" },
        EUR: { name: "Euro", code: "EUR" },
        GBP: { name: "British Pound", code: "GBP" },
        JPY: { name: "Japanese Yen", code: "JPY" },
        CAD: { name: "Canadian Dollar", code: "CAD" },
        AUD: { name: "Australian Dollar", code: "AUD" },
        CHF: { name: "Swiss Franc", code: "CHF" },
        INR: { name: "Indian Rupee", code: "INR" }
      };
      setCurrencies(fallback);
    }
  };

  const convertCurrency = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setResult("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Check conversion cache
      const cacheKey = `conversion_${fromCurrency}_${toCurrency}`;
      const cached = localStorage.getItem(cacheKey);
      let rate = null;

      if (cached) {
        const { rate: cachedRate, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          rate = cachedRate;
        }
      }

      // Fetch rate if not cached
      if (!rate) {
        const response = await fetch(
          `${API_BASE}/latest?apikey=${API_KEY}&base_currency=${fromCurrency}&currencies=${toCurrency}`,
          {
            headers: {
              'Accept': 'application/json',
            }
          }
        );

        if (!response.ok) {
          console.error(`Conversion API error: ${response.status} ${response.statusText}`);
          throw new Error(`Conversion failed: ${response.status}`);
        }

        const data = await response.json();
        rate = data.data[toCurrency];

        if (!rate) {
          throw new Error("Exchange rate not available");
        }

        // Cache the rate
        localStorage.setItem(cacheKey, JSON.stringify({
          rate,
          timestamp: Date.now()
        }));
      }

      const convertedAmount = parseFloat(amount) * rate;
      setResult(convertedAmount.toFixed(2));
      
      // Track usage
      trackCurrencyConversion(fromCurrency, toCurrency);
    } catch (err) {
      console.error('Currency conversion error:', err);
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setResult("");
    } finally {
      setLoading(false);
    }
  };

  const trackCurrencyConversion = (from: string, to: string) => {
    try {
      const statsKey = "enzonic_currency_stats";
      const stats = JSON.parse(localStorage.getItem(statsKey) || "{}");
      const key = `${from}_${to}`;
      stats[key] = (stats[key] || 0) + 1;
      stats.total = (stats.total || 0) + 1;
      localStorage.setItem(statsKey, JSON.stringify(stats));
    } catch {
      // Silently fail
    }
  };

  const popularCurrencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR"];
  const availableCurrencies = Object.keys(currencies).length > 0 
    ? Object.keys(currencies).sort() 
    : popularCurrencies;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-green-500/5 to-emerald-500/10">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-green-500/20">
            <div className="p-1.5 bg-green-500/10 rounded-full">
              <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-muted-foreground">Currency</span>
            </div>
            {lastUpdate && (
              <span className="text-xs text-muted-foreground ml-auto">{new Date(lastUpdate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            )}
          </div>

          <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
            />
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map(code => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-muted-foreground">→</span>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map(code => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading && (
            <div className="bg-background border rounded-lg p-4 text-center">
              <div className="text-muted-foreground">Converting...</div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}

          {result && !loading && !error && (
            <div className="bg-background border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{result} {toCurrency}</div>
              <div className="text-sm text-muted-foreground mt-2">
                {amount} {fromCurrency} = {result} {toCurrency}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            Rates are cached for 1 hour • Real-time exchange rates
          </div>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}
