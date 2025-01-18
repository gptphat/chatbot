function removePunctuation(str: string): string {
    return str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s{2,}/g, " ");
}

function longestCommonSubsequence(wordsA: string[], wordsB: string[]): string[] {
    const m = wordsA.length;
    const n = wordsB.length;

    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (wordsA[i - 1] === wordsB[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    let lcs: string[] = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
        if (wordsA[i - 1] === wordsB[j - 1]) {
            lcs.unshift(wordsA[i - 1]);
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }

    return lcs;
}

export function isMatchAboveThreshold(A: string, B: string, percentag: number = 0.5): boolean {
    const wordsA = removePunctuation(A.toLowerCase()).split(' ').filter(word => word.length > 0);
    const wordsB = removePunctuation(B.toLowerCase()).split(' ').filter(word => word.length > 0);
    const lcs = longestCommonSubsequence(wordsA, wordsB);
    const lcsLength = lcs.length;

    const percentageA = (lcsLength / wordsA.length);
    const percentageB = (lcsLength / wordsB.length);
    console.log(A, " percentageA ", percentageA, " ",B, " percentageB ", percentageB)

    if (percentageA >= percentag && percentageB >= percentag) {
        return true;
    }
    return false;
}
