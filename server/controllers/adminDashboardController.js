const Resume = require('../models/Resume');

async function getDashboard(req, res, next) {
  try {
    const [
      totalResumes,
      totalDuplicates,
      parsingSuccessCount,
      parsingFailureCount,
      recentUploads,
      skillSummary
    ] = await Promise.all([
      Resume.countDocuments(),
      Resume.countDocuments({ duplicateFlag: true }),
      Resume.countDocuments({ parsingStatus: 'success' }),
      Resume.countDocuments({ parsingStatus: 'failure' }),
      Resume.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('parsedData.name parsedData.emails parsedData.phones duplicateFlag parsingStatus createdAt')
        .lean(),
      Resume.aggregate([
        { $match: { parsingStatus: 'success' } },
        { $unwind: { path: '$parsedData.skills', preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: { $toLower: '$parsedData.skills' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ])
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalResumes,
        totalDuplicates,
        parsingSuccessCount,
        parsingFailureCount,
        recentUploads,
        skillSummary: skillSummary.map((item) => ({
          skill: item._id,
          count: item.count
        }))
      }
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getDashboard
};
