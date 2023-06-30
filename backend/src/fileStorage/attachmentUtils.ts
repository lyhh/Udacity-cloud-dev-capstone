import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

// Implement the fileStogare logic
export class AttachmentUtils {
    constructor(
        private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
        private readonly s3Bucket = process.env.ATTACHMENT_S3_BUCKET,
        private readonly signedUrlExpiration = process.env.SIGNED_URL_EXPIRATION
    ) {}

    getAttachmentURL(todoId: string): string {
        return `https://${this.s3Bucket}.s3.amazonaws.com/${todoId}`
    }

    async generateAttachmentURL(todoId: string): Promise<string> {
        const signedUrl = this.s3.getSignedUrl('putObject', {
            Bucket: this.s3Bucket,
            Key: todoId,
            Expires: Number(this.signedUrlExpiration)
          })
     
        return signedUrl
    }
}
