#include <iostream>
using namespace std;
int main() {
  int num1, num2;
  cin >> num1 >> num2;
  cout << "Sum: " << num1 + num2 << endl;
  cout << "Difference: " << num1 - num2 << endl;
  cout << "Product: " << num1 * num2 << endl;
  cout << "Quotient: " << static_cast<double>(num1) / num2 << endl;
  return 0;
}