
// C code is executed sequentially, line by line.
// Comments like these are ignored by the compiler but help in code documentation.
// It's where the program begins its journey.

#include <stdio.h>

int main() {
    int num1, num2;

    // Input
    scanf("%d %d", &num1, &num2);

    // Calculate the sum
    int sum = num1 + num2;

    // Output
    printf("%d\n", sum);

    return 0;
}