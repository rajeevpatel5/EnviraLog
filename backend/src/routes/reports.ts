import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Generate and export CSV report
router.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const { deviceId, startDate, endDate } = req.query;

    const deviceWhere = req.user!.role === 'ADMIN' ? {} : { userId: req.user!.id };
    const since = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const until = endDate ? new Date(endDate as string) : new Date();

    const data = await prisma.sensorData.findMany({
      where: {
        device: { ...deviceWhere },
        ...(deviceId && { deviceId: deviceId as string }),
        createdAt: { gte: since, lte: until },
      },
      include: { device: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const headers = [
      'Timestamp', 'Device', 'Temperature (°C)', 'Humidity (%)', 'Air Quality',
    ];

    const rows = data.map(d => [
      d.createdAt.toISOString(),
      d.device.name,
      d.temperature ?? '',
      d.humidity ?? '',
      d.airQuality ?? '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="envirologapp-report-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

// Get report summary
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, deviceId } = req.query;
    const deviceWhere = req.user!.role === 'ADMIN' ? {} : { userId: req.user!.id };
    const since = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const until = endDate ? new Date(endDate as string) : new Date();

    const data = await prisma.sensorData.findMany({
      where: {
        device: { ...deviceWhere },
        ...(deviceId && { deviceId: deviceId as string }),
        createdAt: { gte: since, lte: until },
      },
    });

    const avg = (arr: (number | null)[]) => {
      const nums = arr.filter(n => n !== null) as number[];
      return nums.length ? parseFloat((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)) : null;
    };
    const max = (arr: (number | null)[]) => {
      const nums = arr.filter(n => n !== null) as number[];
      return nums.length ? Math.max(...nums) : null;
    };
    const min = (arr: (number | null)[]) => {
      const nums = arr.filter(n => n !== null) as number[];
      return nums.length ? Math.min(...nums) : null;
    };

    const alertsInRange = await prisma.alert.count({
      where: {
        device: { ...deviceWhere },
        createdAt: { gte: since, lte: until },
      },
    });

    res.json({
      success: true,
      data: {
        period: { from: since, to: until },
        readings: data.length,
        alerts: alertsInRange,
        temperature: { avg: avg(data.map(d => d.temperature)), max: max(data.map(d => d.temperature)), min: min(data.map(d => d.temperature)) },
        humidity: { avg: avg(data.map(d => d.humidity)), max: max(data.map(d => d.humidity)), min: min(data.map(d => d.humidity)) },
        airQuality: { avg: avg(data.map(d => d.airQuality)), max: max(data.map(d => d.airQuality)), min: min(data.map(d => d.airQuality)) },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate summary' });
  }
});

export default router;
