import { HfInference } from '@huggingface/inference';
import fs from 'fs';

const prompt = 'semiconductor company mascot character, friendly tech mascot, modern corporate design, chip-inspired character, professional illustration, cute and approachable, blue and silver color scheme';

async function generateImage() {
    try {
        const hfToken = process.env.HF_TOKEN;
        if (!hfToken) {
            console.error('오류: HF_TOKEN 환경 변수가 설정되지 않았습니다.');
            console.log('Hugging Face에서 토큰을 발급받아 환경 변수로 설정해주세요.');
            process.exit(1);
        }

        console.log('이미지 생성 중...');
        const client = new HfInference(hfToken);
        const endpointClient = client.endpoint('https://router.huggingface.co');
        
        const imageBlob = await endpointClient.textToImage({
            provider: 'auto',
            model: 'black-forest-labs/FLUX.1-schnell',
            inputs: prompt,
            parameters: { num_inference_steps: 5 }
        });

        const buffer = Buffer.from(await imageBlob.arrayBuffer());
        const outputPath = 'semiconductor-character.png';
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`✅ 이미지가 생성되었습니다: ${outputPath}`);
    } catch (error) {
        console.error('오류:', error.message);
        process.exit(1);
    }
}

generateImage();

