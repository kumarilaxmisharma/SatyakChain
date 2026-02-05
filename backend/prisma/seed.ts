import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

// Demo document content
const DEMO_DOCUMENTS = [
  {
    title: "Bachelor's Degree in Computer Science",
    description: "Awarded to John Doe for completing the undergraduate program",
    content: "This is to certify that John Doe has successfully completed...",
  },
  {
    title: "Professional Certificate - Blockchain Development",
    description: "Completion of 40-hour blockchain development course",
    content: "Certificate of completion for blockchain development...",
  },
  {
    title: "Employment Verification Letter",
    description: "Verification of employment at Tech Corp",
    content: "This letter confirms that Jane Smith was employed...",
  },
];

async function main() {
  console.log("🌱 Seeding CertiChain database...\n");

  // Your wallet address (the deployer = issuer)
  const issuerAddress = "0x49f0d846cEA4a5E3Fdba7F25046b87aCF4C1EfFB";
  
  // Create a demo holder address
  const holderAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f56190";

  // 1. Create Issuer User
  const issuer = await prisma.user.upsert({
    where: { walletAddress: issuerAddress.toLowerCase() },
    update: {},
    create: {
      walletAddress: issuerAddress.toLowerCase(),
      role: "ISSUER",
      name: "Demo University",
      email: "admin@demo-university.edu",
    },
  });
  console.log(`✅ Created Issuer: ${issuer.name} (${issuer.walletAddress})`);

  // 2. Create Holder User
  const holder = await prisma.user.upsert({
    where: { walletAddress: holderAddress.toLowerCase() },
    update: {},
    create: {
      walletAddress: holderAddress.toLowerCase(),
      role: "HOLDER",
      name: "John Doe",
      email: "john.doe@example.com",
    },
  });
  console.log(`✅ Created Holder: ${holder.name} (${holder.walletAddress})`);

  // 3. Create Demo Documents
  console.log("\n📄 Creating demo documents...\n");

  for (let i = 0; i < DEMO_DOCUMENTS.length; i++) {
    const doc = DEMO_DOCUMENTS[i];
    
    // Generate hash from content
    const documentHash = crypto
      .createHash("sha256")
      .update(doc.content + Date.now() + i)
      .digest("hex");

    // Create document in database
    const document = await prisma.document.create({
      data: {
        title: doc.title,
        description: doc.description,
        documentHash: `0x${documentHash}`,
        fileUrl: `/uploads/demo-document-${i + 1}.pdf`,
        fileType: "application/pdf",
        fileSize: 1024 * (i + 1), // Dummy size
        status: "ISSUED",
        issuerId: issuer.id,
        holderId: holder.id,
        tokenId: String(i + 1), // tokenId is String in schema
        txHash: `0x${crypto.randomBytes(32).toString("hex")}`,
        issuedAt: new Date(),
      },
    });

    console.log(`   📜 Document #${i + 1}: ${document.title}`);
    console.log(`      ID: ${document.id}`);
    console.log(`      Hash: ${document.documentHash.slice(0, 20)}...`);
    console.log("");
  }

  // 4. Create a verification record
  const firstDoc = await prisma.document.findFirst();
  if (firstDoc) {
    await prisma.verification.create({
      data: {
        documentId: firstDoc.id,
        verifierIp: "127.0.0.1",
        result: true,
        checkedHash: firstDoc.documentHash,
      },
    });
    console.log(`✅ Created sample verification record`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("🎉 Seeding complete!");
  console.log("=".repeat(50));
  console.log("\n📋 You can now verify documents using these IDs:");
  
  const allDocs = await prisma.document.findMany({ select: { id: true, title: true } });
  allDocs.forEach((d) => {
    console.log(`   • ${d.id} → "${d.title}"`);
  });
  
  console.log("\n🔗 Open Prisma Studio to view data: pnpm db:studio");
  console.log("🌐 Open the app: http://localhost:3000/verify");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
