import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Create or get external vendor
 */
export async function createOrGetVendor(tenantId: string, name: string, phone: string) {
  let vendor = await prisma.externalVendor.findFirst({
    where: {
      tenantId,
      phone,
    },
  })

  if (!vendor) {
    vendor = await prisma.externalVendor.create({
      data: {
        tenantId,
        name,
        phone,
      },
    })
  }

  return vendor
}

/**
 * Get all vendors for a tenant
 */
export async function getVendorsForTenant(tenantId: string) {
  return prisma.externalVendor.findMany({
    where: {
      tenantId,
    },
    include: {
      sales: true,
      payments: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * Get vendor details
 */
export async function getVendor(tenantId: string, vendorId: string) {
  return prisma.externalVendor.findFirst({
    where: {
      tenantId,
      id: vendorId,
    },
    include: {
      sales: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      payments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })
}

/**
 * Record a sale from external vendor
 */
export async function recordVendorSale(
  tenantId: string,
  vendorId: string,
  amount: number,
  description: string | undefined,
  userId: string | undefined
) {
  // Generate sale number
  const count = await prisma.externalVendorSale.count({
    where: { tenantId },
  })
  const saleNumber = `EXT-${Date.now()}-${count + 1}`

  const sale = await prisma.externalVendorSale.create({
    data: {
      tenantId,
      vendorId,
      saleNumber,
      amount,
      description,
      userId,
    },
  })

  // Update vendor balance
  const vendor = await prisma.externalVendor.findUnique({
    where: { id: vendorId },
  })

  if (vendor) {
    const newTotalSales = vendor.totalSales.toNumber() + amount
    const newBalance = newTotalSales - vendor.totalPaid.toNumber()

    await prisma.externalVendor.update({
      where: { id: vendorId },
      data: {
        totalSales: newTotalSales,
        balance: newBalance,
      },
    })
  }

  return sale
}

/**
 * Record payment to vendor
 */
export async function recordVendorPayment(
  tenantId: string,
  vendorId: string,
  amount: number,
  paymentMethod: string,
  paymentReference: string | undefined,
  userId: string | undefined,
  notes: string | undefined
) {
  const payment = await prisma.externalVendorPayment.create({
    data: {
      tenantId,
      vendorId,
      amount,
      paymentMethod,
      paymentReference,
      userId,
      notes,
    },
  })

  // Update vendor balance
  const vendor = await prisma.externalVendor.findUnique({
    where: { id: vendorId },
  })

  if (vendor) {
    const newTotalPaid = vendor.totalPaid.toNumber() + amount
    const newBalance = vendor.totalSales.toNumber() - newTotalPaid

    await prisma.externalVendor.update({
      where: { id: vendorId },
      data: {
        totalPaid: newTotalPaid,
        balance: newBalance,
      },
    })
  }

  return payment
}

/**
 * Get vendor sales
 */
export async function getVendorSales(tenantId: string, vendorId: string) {
  return prisma.externalVendorSale.findMany({
    where: {
      tenantId,
      vendorId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * Get vendor payments
 */
export async function getVendorPayments(tenantId: string, vendorId: string) {
  return prisma.externalVendorPayment.findMany({
    where: {
      tenantId,
      vendorId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * Get all external vendor sales for a tenant
 */
export async function getAllExternalVendorSales(tenantId: string) {
  return prisma.externalVendorSale.findMany({
    where: {
      tenantId,
    },
    include: {
      vendor: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * Get statistics for external vendors
 */
export async function getExternalVendorStats(tenantId: string) {
  const vendors = await prisma.externalVendor.findMany({
    where: {
      tenantId,
    },
  })

  const totalSales = vendors.reduce((sum, v) => sum + v.totalSales.toNumber(), 0)
  const totalPaid = vendors.reduce((sum, v) => sum + v.totalPaid.toNumber(), 0)
  const totalBalance = vendors.reduce((sum, v) => sum + v.balance.toNumber(), 0)

  return {
    vendorCount: vendors.length,
    totalSales,
    totalPaid,
    totalBalance,
  }
}
