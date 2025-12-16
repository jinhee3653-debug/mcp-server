import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { InferenceClient } from '@huggingface/inference'
import { z } from 'zod'

// Smithery 배포를 위한 설정 스키마
export const configSchema = z.object({
    hfToken: z
        .string()
        .optional()
        .describe('Hugging Face API 토큰 (이미지 생성 기능에 필요)')
})

// 국가 이름을 IANA 시간대로 매핑
const countryToTimezone: Record<string, string> = {
    한국: 'Asia/Seoul',
    '대한민국': 'Asia/Seoul',
    'South Korea': 'Asia/Seoul',
    'Korea': 'Asia/Seoul',
    미국: 'America/New_York',
    'United States': 'America/New_York',
    'USA': 'America/New_York',
    'US': 'America/New_York',
    일본: 'Asia/Tokyo',
    'Japan': 'Asia/Tokyo',
    중국: 'Asia/Shanghai',
    'China': 'Asia/Shanghai',
    영국: 'Europe/London',
    'United Kingdom': 'Europe/London',
    'UK': 'Europe/London',
    프랑스: 'Europe/Paris',
    'France': 'Europe/Paris',
    독일: 'Europe/Berlin',
    'Germany': 'Europe/Berlin',
    이탈리아: 'Europe/Rome',
    'Italy': 'Europe/Rome',
    스페인: 'Europe/Madrid',
    'Spain': 'Europe/Madrid',
    러시아: 'Europe/Moscow',
    'Russia': 'Europe/Moscow',
    인도: 'Asia/Kolkata',
    'India': 'Asia/Kolkata',
    호주: 'Australia/Sydney',
    'Australia': 'Australia/Sydney',
    브라질: 'America/Sao_Paulo',
    'Brazil': 'America/Sao_Paulo',
    캐나다: 'America/Toronto',
    'Canada': 'America/Toronto',
    멕시코: 'America/Mexico_City',
    'Mexico': 'America/Mexico_City',
    싱가포르: 'Asia/Singapore',
    'Singapore': 'Asia/Singapore',
    태국: 'Asia/Bangkok',
    'Thailand': 'Asia/Bangkok',
    베트남: 'Asia/Ho_Chi_Minh',
    'Vietnam': 'Asia/Ho_Chi_Minh',
    인도네시아: 'Asia/Jakarta',
    'Indonesia': 'Asia/Jakarta',
    필리핀: 'Asia/Manila',
    'Philippines': 'Asia/Manila',
    아랍에미리트: 'Asia/Dubai',
    'UAE': 'Asia/Dubai',
    'United Arab Emirates': 'Asia/Dubai',
    사우디아라비아: 'Asia/Riyadh',
    'Saudi Arabia': 'Asia/Riyadh',
    이집트: 'Africa/Cairo',
    'Egypt': 'Africa/Cairo',
    남아프리카: 'Africa/Johannesburg',
    'South Africa': 'Africa/Johannesburg',
    아르헨티나: 'America/Argentina/Buenos_Aires',
    'Argentina': 'America/Argentina/Buenos_Aires',
    칠레: 'America/Santiago',
    'Chile': 'America/Santiago',
    뉴질랜드: 'Pacific/Auckland',
    'New Zealand': 'Pacific/Auckland'
}

// Smithery 배포를 위한 createServer 함수 (default export)
export default function createServer({ config }: { config: z.infer<typeof configSchema> }) {
    // Create server instance
    const server = new McpServer({
        name: 'mcp-server',
        version: '1.0.0'
    })

    server.registerTool(
        'greet',
        {
            description: '이름과 언어를 입력하면 인사말을 반환합니다.',
            inputSchema: z.object({
                name: z.string().describe('인사할 사람의 이름'),
                language: z
                    .enum(['ko', 'en'])
                    .optional()
                    .default('en')
                    .describe('인사 언어 (기본값: en)')
            }),
            outputSchema: z.object({
                content: z
                    .array(
                        z.object({
                            type: z.literal('text'),
                            text: z.string().describe('인사말')
                        })
                    )
                    .describe('인사말')
            })
        },
        async ({ name, language }) => {
            const greeting =
                language === 'ko'
                    ? `안녕하세요, ${name}님!`
                    : `Hey there, ${name}! 👋 Nice to meet you!`

            return {
                content: [
                    {
                        type: 'text' as const,
                        text: greeting
                    }
                ],
                structuredContent: {
                    content: [
                        {
                            type: 'text' as const,
                            text: greeting
                        }
                    ]
                }
            }
        }
    )

    server.registerTool(
        'calculator',
        {
            description: '두 개의 숫자와 연산자를 입력받아 계산 결과를 반환합니다.',
            inputSchema: z.object({
                num1: z.number().describe('첫 번째 숫자'),
                num2: z.number().describe('두 번째 숫자'),
                operator: z
                    .enum(['+', '-', '*', '/'])
                    .describe('연산자 (+, -, *, /)')
            }),
            outputSchema: z.object({
                content: z
                    .array(
                        z.object({
                            type: z.literal('text'),
                            text: z.string().describe('계산 결과')
                        })
                    )
                    .describe('계산 결과')
            })
        },
        async ({ num1, num2, operator }) => {
            let result: number
            let expression: string

            switch (operator) {
                case '+':
                    result = num1 + num2
                    expression = `${num1} + ${num2}`
                    break
                case '-':
                    result = num1 - num2
                    expression = `${num1} - ${num2}`
                    break
                case '*':
                    result = num1 * num2
                    expression = `${num1} × ${num2}`
                    break
                case '/':
                    if (num2 === 0) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: '오류: 0으로 나눌 수 없습니다.'
                                }
                            ],
                            structuredContent: {
                                content: [
                                    {
                                        type: 'text' as const,
                                        text: '오류: 0으로 나눌 수 없습니다.'
                                    }
                                ]
                            }
                        }
                    }
                    result = num1 / num2
                    expression = `${num1} ÷ ${num2}`
                    break
            }

            const resultText = `${expression} = ${result}`

            return {
                content: [
                    {
                        type: 'text' as const,
                        text: resultText
                    }
                ],
                structuredContent: {
                    content: [
                        {
                            type: 'text' as const,
                            text: resultText
                        }
                    ]
                }
            }
        }
    )

    server.registerTool(
        'get_country_time',
        {
            description: '국가 이름을 입력하면 해당 국가의 현재 시간을 반환합니다.',
            inputSchema: z.object({
                country: z.string().describe('국가 이름 (한국어 또는 영어)')
            }),
            outputSchema: z.object({
                content: z
                    .array(
                        z.object({
                            type: z.literal('text'),
                            text: z.string().describe('국가의 현재 시간 정보')
                        })
                    )
                    .describe('시간 정보')
            })
        },
        async ({ country }) => {
            // 국가 이름을 정규화 (대소문자 무시)
            const normalizedCountry = country.trim()
            const timezone = countryToTimezone[normalizedCountry]

            if (!timezone) {
                const availableCountries = Object.keys(countryToTimezone)
                    .filter((key) => !key.includes('/'))
                    .slice(0, 10)
                    .join(', ')
                
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `오류: "${country}" 국가를 찾을 수 없습니다.\n\n지원되는 국가 예시: ${availableCountries}...`
                        }
                    ],
                    structuredContent: {
                        content: [
                            {
                                type: 'text' as const,
                                text: `오류: "${country}" 국가를 찾을 수 없습니다.\n\n지원되는 국가 예시: ${availableCountries}...`
                            }
                        ]
                    }
                }
            }

            try {
                const now = new Date()
                const formatter = new Intl.DateTimeFormat('ko-KR', {
                    timeZone: timezone,
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    weekday: 'long',
                    hour12: false
                })

                const timeString = formatter.format(now)
                const resultText = `${country}의 현재 시간:\n${timeString} (${timezone})`

                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: resultText
                        }
                    ],
                    structuredContent: {
                        content: [
                            {
                                type: 'text' as const,
                                text: resultText
                            }
                        ]
                    }
                }
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `오류: 시간 정보를 가져오는 중 문제가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
                        }
                    ],
                    structuredContent: {
                        content: [
                            {
                                type: 'text' as const,
                                text: `오류: 시간 정보를 가져오는 중 문제가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
                            }
                        ]
                    }
                }
            }
        }
    )

    server.registerTool(
        'geocode',
        {
            description: '도시 이름이나 주소를 입력하면 위도와 경도 좌표를 반환합니다. Nominatim OpenStreetMap API를 사용합니다.',
            inputSchema: z.object({
                address: z.string().describe('검색할 도시 이름 또는 주소 (예: "서울", "New York", "서울특별시 강남구")'),
                limit: z
                    .number()
                    .int()
                    .min(1)
                    .max(10)
                    .optional()
                    .default(1)
                    .describe('반환할 결과의 최대 개수 (기본값: 1, 최대: 10)')
            }),
            outputSchema: z.object({
                content: z
                    .array(
                        z.object({
                            type: z.literal('text'),
                            text: z.string().describe('위도와 경도 좌표 정보')
                        })
                    )
                    .describe('좌표 정보')
            })
        },
        async ({ address, limit }) => {
            try {
                // Nominatim API 엔드포인트
                const baseUrl = 'https://nominatim.openstreetmap.org/search'
                const params = new URLSearchParams({
                    q: address,
                    format: 'json',
                    limit: limit.toString(),
                    addressdetails: '1'
                })

                const url = `${baseUrl}?${params.toString()}`

                // HTTP 요청 (User-Agent 헤더 필수)
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'MCP-Geocode-Tool/1.0'
                    }
                })

                if (!response.ok) {
                    throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`)
                }

                const data = await response.json()

                if (!Array.isArray(data) || data.length === 0) {
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: `검색 결과를 찾을 수 없습니다: "${address}"`
                            }
                        ],
                        structuredContent: {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: `검색 결과를 찾을 수 없습니다: "${address}"`
                                }
                            ]
                        }
                    }
                }

                // 결과 포맷팅
                const results = data.map((result: any, index: number) => {
                    const lat = parseFloat(result.lat)
                    const lon = parseFloat(result.lon)
                    const displayName = result.display_name || address
                    
                    return `결과 ${index + 1}:
주소: ${displayName}
위도: ${lat}
경도: ${lon}
좌표: ${lat}, ${lon}`
                }).join('\n\n')

                const resultText = `"${address}" 검색 결과:\n\n${results}`

                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: resultText
                        }
                    ],
                    structuredContent: {
                        content: [
                            {
                                type: 'text' as const,
                                text: resultText
                            }
                        ]
                    }
                }
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `오류: 주소 검색 중 문제가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
                        }
                    ],
                    structuredContent: {
                        content: [
                            {
                                type: 'text' as const,
                                text: `오류: 주소 검색 중 문제가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
                            }
                        ]
                    }
                }
            }
        }
    )

    server.registerTool(
        'get-weather',
        {
            description: '위도와 경도 좌표, 예보 기간을 입력받아 해당 위치의 현재 날씨와 예보 정보를 제공합니다.',
            inputSchema: z.object({
                latitude: z
                    .number()
                    .min(-90)
                    .max(90)
                    .describe('위도 좌표 (-90 ~ 90)'),
                longitude: z
                    .number()
                    .min(-180)
                    .max(180)
                    .describe('경도 좌표 (-180 ~ 180)'),
                forecast_days: z
                    .number()
                    .int()
                    .min(1)
                    .max(16)
                    .optional()
                    .default(7)
                    .describe('예보 기간 (일 단위, 기본값: 7일, 최대: 16일)'),
                timezone: z
                    .string()
                    .optional()
                    .default('auto')
                    .describe('시간대 (기본값: auto, 예: Asia/Seoul, UTC)')
            }),
            outputSchema: z.object({
                content: z
                    .array(
                        z.object({
                            type: z.literal('text'),
                            text: z.string().describe('날씨 정보')
                        })
                    )
                    .describe('날씨 정보')
            })
        },
        async ({ latitude, longitude, forecast_days = 7, timezone = 'auto' }) => {
            try {
                // Open-Meteo API 엔드포인트
                const baseUrl = 'https://api.open-meteo.com/v1/forecast'
                const params = new URLSearchParams({
                    latitude: latitude.toString(),
                    longitude: longitude.toString(),
                    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m',
                    daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max',
                    forecast_days: forecast_days.toString(),
                    timezone: timezone
                })

                const url = `${baseUrl}?${params.toString()}`

                const response = await fetch(url)

                if (!response.ok) {
                    throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`)
                }

                const data = await response.json()

                if (!data.current || !data.daily) {
                    throw new Error('API 응답 형식이 올바르지 않습니다.')
                }

                // 날씨 코드를 설명으로 변환하는 함수
                const getWeatherDescription = (code: number): string => {
                    const weatherCodes: Record<number, string> = {
                        0: '맑음',
                        1: '대체로 맑음',
                        2: '부분적으로 흐림',
                        3: '흐림',
                        45: '안개',
                        48: '서리 안개',
                        51: '약한 이슬비',
                        53: '보통 이슬비',
                        55: '강한 이슬비',
                        56: '약한 동결 이슬비',
                        57: '강한 동결 이슬비',
                        61: '약한 비',
                        63: '보통 비',
                        65: '강한 비',
                        66: '약한 동결 비',
                        67: '강한 동결 비',
                        71: '약한 눈',
                        73: '보통 눈',
                        75: '강한 눈',
                        77: '눈알갱이',
                        80: '약한 소나기',
                        81: '보통 소나기',
                        82: '강한 소나기',
                        85: '약한 눈 소나기',
                        86: '강한 눈 소나기',
                        95: '뇌우',
                        96: '우박과 함께하는 뇌우',
                        99: '강한 우박과 함께하는 뇌우'
                    }
                    return weatherCodes[code] || `코드 ${code}`
                }

                // 현재 날씨 정보 포맷팅
                const current = data.current
                const currentTime = current.time || 'N/A'
                const currentTemp = current.temperature_2m !== undefined ? `${current.temperature_2m}°C` : 'N/A'
                const currentHumidity = current.relative_humidity_2m !== undefined ? `${current.relative_humidity_2m}%` : 'N/A'
                const currentWeather = current.weather_code !== undefined ? getWeatherDescription(current.weather_code) : 'N/A'
                const currentWindSpeed = current.wind_speed_10m !== undefined ? `${current.wind_speed_10m} km/h` : 'N/A'
                const currentWindDir = current.wind_direction_10m !== undefined ? `${current.wind_direction_10m}°` : 'N/A'

                // 일별 예보 정보 포맷팅
                const daily = data.daily
                const dailyForecasts: string[] = []

                if (daily.time && Array.isArray(daily.time)) {
                    for (let i = 0; i < daily.time.length; i++) {
                        const date = daily.time[i]
                        const maxTemp = daily.temperature_2m_max?.[i] !== undefined ? `${daily.temperature_2m_max[i]}°C` : 'N/A'
                        const minTemp = daily.temperature_2m_min?.[i] !== undefined ? `${daily.temperature_2m_min[i]}°C` : 'N/A'
                        const weather = daily.weather_code?.[i] !== undefined ? getWeatherDescription(daily.weather_code[i]) : 'N/A'
                        const precipitation = daily.precipitation_sum?.[i] !== undefined ? `${daily.precipitation_sum[i]} mm` : '0 mm'
                        const windSpeed = daily.wind_speed_10m_max?.[i] !== undefined ? `${daily.wind_speed_10m_max[i]} km/h` : 'N/A'

                        dailyForecasts.push(
                            `📅 ${date}\n` +
                            `   날씨: ${weather}\n` +
                            `   온도: ${minTemp} ~ ${maxTemp}\n` +
                            `   강수량: ${precipitation}\n` +
                            `   최대 풍속: ${windSpeed}`
                        )
                    }
                }

                // 결과 텍스트 구성
                const resultText = `🌤️ 날씨 정보 (위도: ${latitude}, 경도: ${longitude})

📍 현재 날씨 (${currentTime})
   날씨: ${currentWeather}
   온도: ${currentTemp}
   습도: ${currentHumidity}
   풍속: ${currentWindSpeed}
   풍향: ${currentWindDir}

📊 ${forecast_days}일 예보
${dailyForecasts.length > 0 ? dailyForecasts.join('\n\n') : '예보 정보를 가져올 수 없습니다.'}`

                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: resultText
                        }
                    ],
                    structuredContent: {
                        content: [
                            {
                                type: 'text' as const,
                                text: resultText
                            }
                        ]
                    }
                }
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `오류: 날씨 정보를 가져오는 중 문제가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
                        }
                    ],
                    structuredContent: {
                        content: [
                            {
                                type: 'text' as const,
                                text: `오류: 날씨 정보를 가져오는 중 문제가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
                            }
                        ]
                    }
                }
            }
        }
    )

    // 이미지 생성 도구 (Hugging Face 토큰이 있을 때만 동작)
    server.tool(
        'generate_image',
        {
            prompt: z.string().describe('이미지 생성을 위한 프롬프트')
        },
        async ({ prompt }) => {
            try {
                // config에서 Hugging Face 토큰 확인
                const hfToken = config?.hfToken
                if (!hfToken) {
                    throw new Error('HF_TOKEN이 설정되지 않았습니다. Smithery 설정에서 hfToken을 입력해주세요.')
                }

                // Hugging Face Inference 클라이언트 생성
                const client = new InferenceClient(hfToken)

                // 이미지 생성 요청
                const imageBlob = await client.textToImage({
                    provider: 'hf-inference',
                    model: 'black-forest-labs/FLUX.1-schnell',
                    inputs: prompt,
                    parameters: { num_inference_steps: 5 }
                })

                // Blob을 ArrayBuffer로 변환 후 base64 인코딩
                const arrayBuffer = await (
                    imageBlob as unknown as Blob
                ).arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)
                const base64Data = buffer.toString('base64')

                return {
                    content: [
                        {
                            type: 'image',
                            data: base64Data,
                            mimeType: 'image/png'
                        }
                    ],
                    annotations: {
                        audience: ['user'],
                        priority: 0.9
                    }
                }
            } catch (error) {
                throw new Error(
                    `이미지 생성 중 오류가 발생했습니다: ${
                        error instanceof Error ? error.message : '알 수 없는 오류'
                    }`
                )
            }
        }
    )

    // 서버 정보와 도구 정보를 반환하는 리소스 등록
    server.registerResource(
        'server-info',
        'mcp://server-info',
        {
            description: '현재 서버 정보와 사용 가능한 도구 목록을 반환합니다.',
            mimeType: 'application/json'
        },
        async () => {
            // 서버 정보 수집
            const serverInfo = {
                server: {
                    name: 'mcp-server',
                    version: '1.0.0'
                },
                tools: [
                    {
                        name: 'greet',
                        description: '이름과 언어를 입력하면 인사말을 반환합니다.',
                        parameters: {
                            name: {
                                type: 'string',
                                description: '인사할 사람의 이름'
                            },
                            language: {
                                type: 'string',
                                enum: ['ko', 'en'],
                                optional: true,
                                default: 'en',
                                description: '인사 언어 (기본값: en)'
                            }
                        }
                    },
                    {
                        name: 'calculator',
                        description: '두 개의 숫자와 연산자를 입력받아 계산 결과를 반환합니다.',
                        parameters: {
                            num1: {
                                type: 'number',
                                description: '첫 번째 숫자'
                            },
                            num2: {
                                type: 'number',
                                description: '두 번째 숫자'
                            },
                            operator: {
                                type: 'string',
                                enum: ['+', '-', '*', '/'],
                                description: '연산자 (+, -, *, /)'
                            }
                        }
                    },
                    {
                        name: 'get_country_time',
                        description: '국가 이름을 입력하면 해당 국가의 현재 시간을 반환합니다.',
                        parameters: {
                            country: {
                                type: 'string',
                                description: '국가 이름 (한국어 또는 영어)'
                            }
                        }
                    },
                    {
                        name: 'geocode',
                        description: '도시 이름이나 주소를 입력하면 위도와 경도 좌표를 반환합니다. Nominatim OpenStreetMap API를 사용합니다.',
                        parameters: {
                            address: {
                                type: 'string',
                                description: '검색할 도시 이름 또는 주소 (예: "서울", "New York", "서울특별시 강남구")'
                            },
                            limit: {
                                type: 'number',
                                integer: true,
                                min: 1,
                                max: 10,
                                optional: true,
                                default: 1,
                                description: '반환할 결과의 최대 개수 (기본값: 1, 최대: 10)'
                            }
                        }
                    },
                    {
                        name: 'get-weather',
                        description: '위도와 경도 좌표, 예보 기간을 입력받아 해당 위치의 현재 날씨와 예보 정보를 제공합니다.',
                        parameters: {
                            latitude: {
                                type: 'number',
                                min: -90,
                                max: 90,
                                description: '위도 좌표 (-90 ~ 90)'
                            },
                            longitude: {
                                type: 'number',
                                min: -180,
                                max: 180,
                                description: '경도 좌표 (-180 ~ 180)'
                            },
                            forecast_days: {
                                type: 'number',
                                integer: true,
                                min: 1,
                                max: 16,
                                optional: true,
                                default: 7,
                                description: '예보 기간 (일 단위, 기본값: 7일, 최대: 16일)'
                            },
                            timezone: {
                                type: 'string',
                                optional: true,
                                default: 'auto',
                                description: '시간대 (기본값: auto, 예: Asia/Seoul, UTC)'
                            }
                        }
                    },
                    {
                        name: 'generate_image',
                        description: '텍스트 프롬프트를 입력받아 AI로 이미지를 생성합니다. Hugging Face FLUX.1-schnell 모델을 사용합니다.',
                        parameters: {
                            prompt: {
                                type: 'string',
                                description: '이미지를 생성할 텍스트 프롬프트'
                            }
                        }
                    }
                ],
                resources: [
                    {
                        name: 'server-info',
                        uri: 'mcp://server-info',
                        description: '현재 서버 정보와 사용 가능한 도구 목록을 반환합니다.',
                        mimeType: 'application/json'
                    }
                ],
                timestamp: new Date().toISOString()
            }

            return {
                contents: [
                    {
                        uri: 'mcp://server-info',
                        mimeType: 'application/json',
                        text: JSON.stringify(serverInfo, null, 2)
                    }
                ]
            }
        }
    )

    // 코드 리뷰 프롬프트 템플릿
    const codeReviewPromptTemplate = `다음 코드를 리뷰해주세요. 다음 항목들을 중점적으로 검토해주세요:

1. **코드 품질 및 가독성**
   - 변수명과 함수명이 명확한가?
   - 코드 구조가 논리적이고 이해하기 쉬운가?
   - 주석이 적절히 작성되어 있는가?

2. **성능 최적화**
   - 불필요한 연산이나 중복 코드가 있는가?
   - 알고리즘의 시간 복잡도가 적절한가?
   - 메모리 사용이 효율적인가?

3. **보안 및 에러 처리**
   - 입력값 검증이 적절히 이루어지는가?
   - 예외 처리가 제대로 되어 있는가?
   - 보안 취약점이 있는가?

4. **모범 사례 준수**
   - 해당 언어/프레임워크의 모범 사례를 따르고 있는가?
   - 코드 스타일 가이드를 준수하고 있는가?

5. **개선 제안**
   - 리팩토링이 필요한 부분이 있는가?
   - 더 나은 대안이 있는가?

코드:
\`\`\`{language}
{code}
\`\`\`

리뷰를 시작해주세요.`

    // 코드 리뷰 프롬프트 등록
    server.registerPrompt(
        'code-review',
        {
            description: '사용자가 제공한 코드를 기반으로 코드 리뷰를 수행하는 프롬프트입니다.',
            argsSchema: {
                code: z.string().describe('리뷰할 코드 블록'),
                language: z
                    .string()
                    .optional()
                    .default('typescript')
                    .describe('코드의 프로그래밍 언어 (예: typescript, javascript, python, java 등)'),
                focusAreas: z
                    .string()
                    .optional()
                    .describe('리뷰 시 중점적으로 살펴볼 영역 (예: 보안, 성능, 가독성, 테스트 등). 쉼표로 구분하여 여러 영역 지정 가능')
            }
        },
        async ({ code, language = 'typescript', focusAreas }) => {
            // 사용자 지정 포커스 영역이 있으면 템플릿에 추가
            let customFocusText = ''
            if (focusAreas) {
                const areas = focusAreas.split(',').map((area: string) => area.trim()).filter(Boolean)
                if (areas.length > 0) {
                    customFocusText = `\n\n**특별히 중점적으로 검토할 영역:**\n${areas.map((area: string) => `- ${area}`).join('\n')}\n`
                }
            }

            // 프롬프트 템플릿에 코드와 언어를 삽입
            const finalPrompt = codeReviewPromptTemplate
                .replace('{language}', language)
                .replace('{code}', code) + customFocusText

            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: finalPrompt
                        }
                    }
                ]
            }
        }
    )

    // Smithery에서 요구하는 McpServer 인스턴스 반환
    return server
}
