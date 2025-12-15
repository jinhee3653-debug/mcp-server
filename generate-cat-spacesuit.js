import { HfInference } from '@huggingface/inference';
import fs from 'fs';
import readline from 'readline';

const prompt = 'cat wearing spacesuit, astronaut cat, space suit, detailed, high quality, cute, professional illustration, space background, floating in space, helmet with visor';

async function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

async function generateImage() {
    try {
        let hfToken = process.env.HF_TOKEN;
        
        if (!hfToken) {
            console.log('Hugging Face API 토큰이 필요합니다.');
            console.log('토큰을 발급받으려면: https://huggingface.co/settings/tokens');
            hfToken = await askQuestion('HF_TOKEN을 입력하세요: ');
            
            if (!hfToken || hfToken.trim() === '') {
                console.error('오류: 토큰이 입력되지 않았습니다.');
                process.exit(1);
            }
        }

        console.log('우주복 입은 고양이 이미지 생성 중...');
        const client = new HfInference(hfToken);
        
        const imageBlob = await client.textToImage({
            provider: 'auto',
            model: 'black-forest-labs/FLUX.1-schnell',
            inputs: prompt,
            parameters: { num_inference_steps: 5 }
        });

        const buffer = Buffer.from(await imageBlob.arrayBuffer());
        const outputPath = 'astronaut-cat.png';
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`✅ 이미지가 생성되었습니다: ${outputPath}`);
        console.log(`📁 파일 위치: ${process.cwd()}\\${outputPath}`);
    } catch (error) {
        console.error('오류:', error.message);
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            console.error('토큰이 유효하지 않습니다. 올바른 토큰을 입력해주세요.');
        }
        process.exit(1);
    }
}

generateImage();

