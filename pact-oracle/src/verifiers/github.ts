import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export async function verifyGithubForPlayer(username: string, requiredCommits: number): Promise<boolean> {
  const today = new Date();
  const isoDate = today.toISOString().split('T')[0];

  const query = `
    query {
      user(login: "${username}") {
        contributionsCollection(from: "${isoDate}T00:00:00Z") {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      'https://api.github.com/graphql',
      { query },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const days = response.data.data.user.contributionsCollection.contributionCalendar.weeks.flatMap(
      (week: any) => week.contributionDays
    );

    const todayContributions = days.find((day: any) => day.date === isoDate)?.contributionCount || 0;

    return todayContributions >= requiredCommits;

  } catch (error: any) {
    console.error('❌ GitHub API error:', error.response?.data || error.message);
    return false;
  }
}
